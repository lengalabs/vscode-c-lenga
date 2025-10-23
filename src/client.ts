import { credentials, ServiceError } from "@grpc/grpc-js";
import * as lenga from "../rpc/generated/lenga";
import * as clenga from "../rpc/generated/c/lenga";
import * as cObjects from "../rpc/generated/c/objects";
import { CConverter } from "./language_objects/converter/converter";
import * as cNodes from "./language_objects/cNodes";
import { snakeCase } from "lodash";

export class Client {
  private lenga_stub: any;
  private clenga_stub: any;
  private converter: CConverter;

  constructor() {
    this.lenga_stub = new lenga.LengaClient("localhost:49100", credentials.createInsecure());
    this.clenga_stub = new clenga.CLengaClient("localhost:49100", credentials.createInsecure());
    this.converter = new CConverter();
  }

  initialize(workspace: string, configUri: string): Promise<void> {
    var request: clenga.InitRequest = {
      workspace,
      configUri,
    };

    return new Promise((resolve, reject) => {
      this.clenga_stub.initialize(request, (err: ServiceError | null, response: lenga.Void) => {
        if (err) {
          reject(new Error(`${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  openFile(id: string, path: string): Promise<cNodes.SourceFile> {
    var request: clenga.OpenRequest = {
      id,
      path: path,
    };

    return new Promise((resolve, reject) => {
      this.clenga_stub.openFile(
        request,
        (err: ServiceError | null, objects: cObjects.SourceFile) => {
          if (err) {
            reject(new Error(`${err.message}`));
          } else {
            const nodes = this.converter.fromProto(objects);
            resolve(nodes);
          }
        }
      );
    });
  }

  edit(
    id: string,
    editedNode: cNodes.LanguageObject
  ): Promise<[cNodes.SourceFile, cNodes.LanguageObject]> {
    var request: clenga.EditRequest = {
      id,
      editedObject: this.converter.objectToProto(editedNode),
    };

    return new Promise((resolve, reject) => {
      this.clenga_stub.edit(request, (err: ServiceError, objects: clenga.EditResponse) => {
        if (err) {
          reject(new Error(`${err}`));
        } else {
          const new_nodes_proto = objects.newObject?.languageObject;
          if (new_nodes_proto && new_nodes_proto.$case === "sourceFile") {
            const new_nodes = this.converter.fromProto(new_nodes_proto.sourceFile);
            const old_nodes = this.converter.protoToObject(objects.oldObject!);
            resolve([new_nodes, old_nodes]);
          } else {
            reject(new Error(`No sourcefile`));
          }
        }
      });
    });
  }

  availableInserts(id: string, nodeId: string, nodeKey: string): Promise<cNodes.LanguageObject[]> {
    var request: clenga.AvailableInsertsRequest = {
      id,
      nodeId,
      nodeKey: snakeCase(nodeKey),
    };

    return new Promise((resolve, reject) => {
      this.clenga_stub.availableInserts(
        request,
        (err: ServiceError, options: clenga.InsertOptions) => {
          if (err) {
            reject(new Error(`${err}`));
          } else {
            const objectOptions = options.options!.map(this.converter.protoToObject);
            resolve(objectOptions);
          }
        }
      );
    });
  }

  save(id: string, writePath: string): Promise<void> {
    var request: clenga.SaveRequest = {
      id,
      writePath,
    };

    return new Promise((resolve, reject) => {
      this.clenga_stub.save(request, (err: ServiceError, objects: clenga.Void) => {
        if (err) {
          reject(new Error(`${err}`));
        } else {
          resolve();
        }
      });
    });
  }

  closeFile(id: string): Promise<void> {
    var request: clenga.CloseRequest = {
      id,
    };

    return new Promise((resolve, reject) => {
      this.clenga_stub.closeFile(request, (err: ServiceError, objects: clenga.Void) => {
        if (err) {
          reject(new Error(`${err}`));
        } else {
          resolve();
        }
      });
    });
  }
}
