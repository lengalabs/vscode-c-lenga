import { credentials, ServiceError } from '@grpc/grpc-js';
// @ts-ignore
import { OpenRequest, Node, InitRequest, Void, EditRequest } from "../rpc/generated/saturn_pb";
// @ts-ignore
import { SaturnClient } from "../rpc/generated/saturn_grpc_pb";

export class Client {
    private stub: any;

    constructor() {
        this.stub = new SaturnClient("localhost:49200", credentials.createInsecure());
    }

    initialize(workspace: string, configUri: string): Promise<void> {
        return new Promise((resolve, reject) => {
            var request = new InitRequest();
            request.setWorkspace(workspace);
            request.setConfiguri(configUri);

            this.stub.initialize(request, (err: ServiceError | null, response: Void) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    resolve();
                }
            });
        });
    }

    openFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var request = new OpenRequest();
            request.setPath(path);

            this.stub.openFile(request, (err: ServiceError | null, node: Node) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    resolve(node.getContent());
                }
            });
        });
    }

    edit(path: string, editData: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var request = new EditRequest();
            request.setPath(path);
            request.setEditdata(editData);

            this.stub.edit(request, (err: ServiceError, node: Node) => {
                if (err) {
                    reject(new Error(`${err}`));
                } else {
                    resolve(node.getContent());
                }
            });
        });
    }
}

