import { credentials, ServiceError } from '@grpc/grpc-js';
import * as lenga from "../rpc/generated/lenga";
import * as clenga from "../rpc/generated/c/lenga";
import * as cObjects from "../rpc/generated/c/objects";
import { CConverter } from './nodes/CConverter';
import * as cNodes from "./nodes/cNodes";

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
            workspace: workspace,
            configUri: configUri,
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

    openFile(path: string): Promise<Array<cNodes.Node>> {
        var request: clenga.OpenRequest = {
            path: path,
        };

        return new Promise((resolve, reject) => {
            this.clenga_stub.openFile(request, (err: ServiceError | null, objects: cObjects.SourceFile) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    const nodes = this.converter.fromProto(objects);
                    resolve(nodes);
                }
            });
        });
    }

    edit(path: string, editedNode: cNodes.Node): Promise<[cNodes.Node[], cNodes.Node]> {
        var request: clenga.EditRequest = {
            path: path,
            editedObject: this.converter.nodeToProto(editedNode),
        };

        return new Promise((resolve, reject) => {
            this.clenga_stub.edit(request, (err: ServiceError, objects: clenga.EditResponse) => {
                if (err) {
                    reject(new Error(`${err}`));
                } else {
                    const new_nodes_proto = objects.newObject?.languageObject;
                    if (new_nodes_proto && new_nodes_proto.$case === "sourceFile") {
                        const new_nodes = this.converter.fromProto(new_nodes_proto.sourceFile);
                        const old_nodes = this.converter.protoToNode(objects.oldObject!);
                        resolve([new_nodes, old_nodes]);
                    } else {
                        reject(new Error(`No sourcefile`));
                    }
                }
            });
        });
    }

    save(path: string, writePath: string): Promise<void> {
        var request: clenga.SaveRequest = {
            path,
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
}

