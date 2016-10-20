import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import * as URI from 'urijs';
import * as _ from 'lodash';

import { AppState } from './../../app.service';
import { Logger } from './log';
import { AppHelpers } from './../helpers/app';

var log = Logger.get('Forge');

/*
 * CommandOptions interface represents the arguments used to
 * invoke operations on Forge
 */
export interface CommandOptions {
  /*
   * Team ID is a kubernetes namespace containing build configs
   */
  teamId?:string;

  /*
   * Project ID is the build config for a given project
   */
  projectId?:string;

  /*
   * Command ID is the Forge command to fetch inputs, validate or execute
   */
  commandId?:string;

  /*
   * Data to post to the server when validating or executing a command
   */
  data?:any;

  /*
   * Additional possible options
   */
  [name:string]:any;
}

/*
 * An angular service that provides operations for invoking on a
 * Forge web service
 */
@Injectable()
export class Forge {

  private urlString:string = undefined;
  private url:uri.URI = undefined;

  constructor(private http: Http, private appState: AppState) {
    var urlString = this.urlString = appState.config.urls['FABRIC8_FORGE']
    this.url = new URI(urlString);
    log.debug("Forge service using URL: ", this.url.toString());
  }

  private createUrl(action:string, options:CommandOptions) {
      var url = this.url.clone().segment(action).segment(options.commandId);
      if (options.teamId && options.projectId) {
        url = url.segment(options.teamId).segment(options.projectId);
      }
      return url;
  }

  /*
   * Get the inputs for a given command ID
   */
  getCommandInputs(options:CommandOptions):Observable<any> {
    if (!options.commandId) {
      throw "Command ID required";
    }
    return AppHelpers.maybeInvoke(this.urlString, () => {
      var url = this.createUrl('commandInput', options);
      log.debug("Using URL: ", url.toString());
      return this.http.get(url.toString())
                      .map((res:Response) => {
                        log.debug("response for command inputs: ", res.json());
                        return res.json();
                      })
                      .catch((error) => {
                        log.error("Error fetching command inputs for command " + options.commandId + ": ", error)
                        return error;
                      });
    }, {});
  };

  /*
   * Execute a command with the supplied inputs
   */
  executeCommand(options:CommandOptions):Observable<any> {
    return AppHelpers.maybeInvoke(this.urlString, () => {
      let data = JSON.stringify(options.data, undefined, 2);
      let requestOptions = AppHelpers.getStandardRequestOptions('application/json');
      let url = this.createUrl('command/execute', options);
      return this.http.post(url.toString(), data, requestOptions)
                      .map((res:Response) => {
                        log.debug("response for execute command: ", res.json());
                        return res.json();
                      })
                      .catch((error) => {
                        log.error("Error validating command inputs: ", error)
                        return error;
                      });
    });
  }

  /*
   * Validate the inputs for a command
   */
  validateCommandInputs(options:CommandOptions):Observable<any> {
    return AppHelpers.maybeInvoke(this.urlString, () => {
      let data = JSON.stringify(options.data, undefined, 2);
      let requestOptions = new RequestOptions({ headers: new Headers({ 'Content-Type': 'application/json' })});
      let url = this.createUrl('command/validate', options);
      return this.http.post(url.toString(), data, requestOptions)
                      .map((res:Response) => {
                        log.debug("response for validate command inputs: ", res.json());
                        return res.json();
                      })
                      .catch((error) => {
                        log.error("Error validating command inputs: ", error)
                        return error;
                      });

    });
  };

    /*
   * Get all the commands available without a project
   */
  getCommands(options?:CommandOptions):Observable<any> {
    return AppHelpers.maybeInvoke(this.urlString, () => {
      var url = this.url.clone().segment('commands');
      if (options && options.teamId && options.projectId) {
        url = url.segment(options.teamId).segment(options.projectId);
      }
      log.debug("Using URL: ", url.toString());
      return this.http.get(url.toString())
                      .map((res:Response) => {
                        var body = <any[]> res.json();
                        log.debug("response for get commands: ", body);
                        var commandMap = {
                          names: [],
                          commands: {}
                        };
                        if (_.isArray(body)) {
                          /* TODO
                          // no point showing disabled commands
                          body = _.filter(body, (item:any) => item.enabled);
                          */
                          _.forEach(body, (item:any) => {
                            var category = <string>_.get(item, 'category') || 'Uncategorized';
                            var commands = <any[]>_.get(commandMap.commands, category);
                            if (!commands) {
                              commandMap.names.push(category);
                              commandMap.names.sort();
                              commands = [item];
                            } else {
                              commands.push(item);
                              commands = _.sortBy(commands, 'name');
                            }
                            commandMap.commands[category] = commands;
                          });
                        } else {
                          log.warn("Expected to receive array, but instead got: ", body);
                        }
                        return commandMap;
                      })
                      .catch((error) => {
                        log.error("Error fetching commands: ", error)
                        return error;
                      });
    }, []);
  }

}
