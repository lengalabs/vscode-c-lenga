import { credentials, ServiceError } from '@grpc/grpc-js';
import { SaturnClient, OpenRequest, InitRequest, Void, EditRequest, Ast } from "../rpc/generated/saturn";
import { CConverter } from './nodes/CConverter';
import * as cNodes from "./nodes/cNodes";

export class Client {
    private stub: any;
    private converter: CConverter;

    constructor() {
        this.stub = new SaturnClient("localhost:49200", credentials.createInsecure());
        this.converter = new CConverter();
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

    openFile(path: string): Promise<Array<cNodes.Node>> {
        var request: OpenRequest = {
            path: path,
        };

        return new Promise((resolve, reject) => {
            this.stub.openFile(request, (err: ServiceError | null, ast: Ast) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    const nodes = this.converter.fromProto(ast);
                    resolve(nodes);
                }
            });
        });
    }

    edit(path: string, editData: string): Promise<Array<cNodes.Node>> {
        var request: EditRequest = {
            path: path,
            editData: editData,
        };
        
        return new Promise((resolve, reject) => {
            this.stub.edit(request, (err: ServiceError, ast: Ast) => {
                if (err) {
                    reject(new Error(`${err}`));
                } else {
                    const nodes = this.converter.fromProto(ast);
                    resolve(nodes);
                }
            });
        });
    }
}

