import * as proto from "../../../rpc/generated/c/objects";
import * as lenga from "../../../rpc/generated/lenga";
import * as objects from "../cNodes";
import { convertProtoDeclarationObjectToTs, convertProtoLanguageObjectToTs } from "./fromProto";
import { convertTsDeclarationObjectToProto, convertTsLanguageObjectToProto } from "./fromTs";

const fieldRenameMap: Record<string, string> = {
  decl_ref_id: "DeclRefId", // Reference
};

export class CConverter {
  public fromProto(protoAst: proto.SourceFile): objects.SourceFile {
    return {
      type: "sourceFile",
      id: protoAst.id,
      code: protoAst.code.map(convertProtoDeclarationObjectToTs),
    };
  }

  public toProto(TsAst: objects.SourceFile): proto.SourceFile {
    return { id: TsAst.id, code: TsAst.code.map(convertTsDeclarationObjectToProto) };
  }

  public objectToProto(ts: objects.LanguageObject): proto.LanguageObject {
    return convertTsLanguageObjectToProto(ts);
  }

  public protoToObject(p: proto.LanguageObject): objects.LanguageObject {
    return convertProtoLanguageObjectToTs(p);
  }
}
