import { credentials, ServiceError } from '@grpc/grpc-js';
import { SaturnClient, OpenRequest, Node, InitRequest, Void, EditRequest } from "../rpc/generated/saturn";

export class Client {
    private stub: any;

    constructor() {
        this.stub = new SaturnClient("localhost:49200", credentials.createInsecure());
    }

    initialize(workspace: string, configUri: string): Promise<void> {
        var request: InitRequest = {
            workspace: workspace,
            configUri: configUri,
        };

        return new Promise((resolve, reject) => {
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
        var request: OpenRequest = {
            path: path,
        };

        return new Promise((resolve, reject) => {
            this.stub.openFile(request, (err: ServiceError | null, node: Node) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    resolve(node.content);
                }
            });
        });
    }

    edit(path: string, editData: string): Promise<string> {
        var request: EditRequest = {
            path: path,
            editData: editData,
        };
        
        return new Promise((resolve, reject) => {
            this.stub.edit(request, (err: ServiceError, node: Node) => {
                if (err) {
                    reject(new Error(`${err}`));
                } else {
                    resolve(node.content);
                }
            });
        });
    }
}

