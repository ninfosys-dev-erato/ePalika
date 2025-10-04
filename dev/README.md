This folder contains local development helper tooling and submodules used for local environment setup.

Integrated submodule
--------------------

- `dev/keycloak-dev` — a submodule tracking https://github.com/ninjagnosis/keycloak-dev. It provides a local Keycloak + Traefik setup used for authentication testing.

Quick notes
-----------

- To clone this repository including submodules:

  git clone --recurse-submodules <repo-url>

- To initialize submodules after a plain clone:

  git submodule update --init --recursive

- To update the `keycloak-dev` submodule to its latest remote main branch:

  cd dev/keycloak-dev
  git fetch origin
  git checkout main
  git pull --ff-only
  cd -
  git add dev/keycloak-dev
  git commit -m "Update keycloak-dev submodule"

If you prefer vendoring the contents instead of a submodule, let me know and I can copy the files into `dev/keycloak-dev` instead.
