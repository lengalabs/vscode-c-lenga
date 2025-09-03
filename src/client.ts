import { credentials, ServiceError } from '@grpc/grpc-js';
import { SaturnClient, OpenRequest, InitRequest, Void, EditRequest } from "../rpc/generated/saturn";
import * as nodes from "../rpc/generated/nodes";

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

    openFile(path: string): Promise<nodes.Node> {
        var request: OpenRequest = {
            path: path,
        };

        return new Promise((resolve, reject) => {
            this.stub.openFile(request, (err: ServiceError | null, node: nodes.Node) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    resolve(node);
                }
            });
        });
    }

    edit(path: string, editData: string): Promise<nodes.Node> {
        var request: EditRequest = {
            path: path,
            editData: editData,
        };
        
        return new Promise((resolve, reject) => {
            this.stub.edit(request, (err: ServiceError, node: nodes.Node) => {
                if (err) {
                    reject(new Error(`${err}`));
                } else {
                    resolve(node);
                }
            });
        });
    }
}

