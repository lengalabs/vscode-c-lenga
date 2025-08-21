// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var saturn_pb = require('./saturn_pb.js');

function serialize_saturn_EditRequest(arg) {
  if (!(arg instanceof saturn_pb.EditRequest)) {
    throw new Error('Expected argument of type saturn.EditRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_saturn_EditRequest(buffer_arg) {
  return saturn_pb.EditRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_saturn_InitRequest(arg) {
  if (!(arg instanceof saturn_pb.InitRequest)) {
    throw new Error('Expected argument of type saturn.InitRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_saturn_InitRequest(buffer_arg) {
  return saturn_pb.InitRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_saturn_Node(arg) {
  if (!(arg instanceof saturn_pb.Node)) {
    throw new Error('Expected argument of type saturn.Node');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_saturn_Node(buffer_arg) {
  return saturn_pb.Node.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_saturn_OpenRequest(arg) {
  if (!(arg instanceof saturn_pb.OpenRequest)) {
    throw new Error('Expected argument of type saturn.OpenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_saturn_OpenRequest(buffer_arg) {
  return saturn_pb.OpenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_saturn_Void(arg) {
  if (!(arg instanceof saturn_pb.Void)) {
    throw new Error('Expected argument of type saturn.Void');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_saturn_Void(buffer_arg) {
  return saturn_pb.Void.deserializeBinary(new Uint8Array(buffer_arg));
}


var SaturnService = exports.SaturnService = {
  initialize: {
    path: '/saturn.Saturn/Initialize',
    requestStream: false,
    responseStream: false,
    requestType: saturn_pb.InitRequest,
    responseType: saturn_pb.Void,
    requestSerialize: serialize_saturn_InitRequest,
    requestDeserialize: deserialize_saturn_InitRequest,
    responseSerialize: serialize_saturn_Void,
    responseDeserialize: deserialize_saturn_Void,
  },
  openFile: {
    path: '/saturn.Saturn/OpenFile',
    requestStream: false,
    responseStream: false,
    requestType: saturn_pb.OpenRequest,
    responseType: saturn_pb.Node,
    requestSerialize: serialize_saturn_OpenRequest,
    requestDeserialize: deserialize_saturn_OpenRequest,
    responseSerialize: serialize_saturn_Node,
    responseDeserialize: deserialize_saturn_Node,
  },
  edit: {
    path: '/saturn.Saturn/Edit',
    requestStream: false,
    responseStream: false,
    requestType: saturn_pb.EditRequest,
    responseType: saturn_pb.Node,
    requestSerialize: serialize_saturn_EditRequest,
    requestDeserialize: deserialize_saturn_EditRequest,
    responseSerialize: serialize_saturn_Node,
    responseDeserialize: deserialize_saturn_Node,
  },
};

exports.SaturnClient = grpc.makeGenericClientConstructor(SaturnService, 'Saturn');
