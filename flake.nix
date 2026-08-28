{
  description = "Development environment for linux-wallpaperengine-gui";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            go
            bun

            pkg-config
            libayatana-appindicator
            gtk3

            golangci-lint
          ];

          shellHook = ''
            echo "Dev-shell ready with $(go version), bun $(bun --version)"
          '';
        };
      }
    );
}
