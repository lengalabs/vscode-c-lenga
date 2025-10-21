{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    protobuf
    nodejs
    nodePackages.npm
  ];

  shellHook = ''
    echo "Development environment loaded"
    echo "- protoc version: $(protoc --version)"
    echo "- node version: $(node --version)"
    echo "- npm version: $(npm --version)"
  '';
}
