import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

var PROTO_PATH = __dirname + '/../protos/saturn.proto';

export class Client {
    private stub: any;

    constructor() {
        var packageDefinition = protoLoader.loadSync(
            PROTO_PATH,
            {keepCase: true,
             longs: String,
             enums: String,
             defaults: true,
             oneofs: true
            });
        var grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;
        this.stub = new grpcPackage.saturn.Saturn('localhost:49200', grpc.credentials.createInsecure());
    }

    initialize(workspace: string, configUri: string): Promise<void> {
        return new Promise((resolve, reject) => {
            var request = {
                workspace: workspace,
                configUri: configUri,
            };

            this.stub.Initialize(request, (err: grpc.ServiceError) => {
                resolve();
            });
        });
    }

    openFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var request = {
                path: path
            };
            this.stub.OpenFile(request, (err: grpc.ServiceError, node: {type: string, content: string}) => {
                if (err) {
                    resolve(`${err}`);
                } else {
                    resolve(node.content);
                }
            });
        });
    }

    edit(path: string, editData: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var request = {
                path: path,
                editData: editData
            };

            this.stub.Edit(request, (err: grpc.ServiceError, node: {type: string, content: string}) => {
                if (err) {
                    resolve(`${err}`);
                } else {
                    resolve(node.content);
                }
            });
        });
    }
}

