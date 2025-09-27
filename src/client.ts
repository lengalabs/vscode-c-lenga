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
        this.lenga_stub = new lenga.LengaClient("localhost:49200", credentials.createInsecure());
        this.clenga_stub = new clenga.CLengaClient("localhost:49200", credentials.createInsecure());
        this.converter = new CConverter();
    }

    initialize(workspace: string, configUri: string): Promise<void> {
        var request: clenga.InitRequest = {
            workspace: workspace,
            configUri: configUri,
        };

        return new Promise((resolve, reject) => {
            this.lenga_stub.initialize(request, (err: ServiceError | null, response: lenga.Void) => {
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
            this.lenga_stub.openFile(request, (err: ServiceError | null, objects: cObjects.SourceFile) => {
                if (err) {
                    reject(new Error(`${err.message}`));
                } else {
                    const nodes = this.converter.fromProto(objects);
                    resolve(nodes);
                }
            });
        });
    }

    edit(path: string, editData: string): Promise<Array<cNodes.Node>> {
        var request: clenga.EditRequest = {
            path: path,
            editData: editData,
        };

        return new Promise((resolve, reject) => {
            this.lenga_stub.edit(request, (err: ServiceError, objects: cObjects.SourceFile) => {
                if (err) {
                    reject(new Error(`${err}`));
                } else {
                    const nodes = this.converter.fromProto(objects);
                    resolve(nodes);
                }
            });
        });
    }
}

