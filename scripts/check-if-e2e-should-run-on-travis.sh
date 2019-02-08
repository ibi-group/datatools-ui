if [[ $TRAVIS_PULL_REQUEST ]] && [[ $TRAVIS_PULL_REQUEST_SLUG == "conveyal/datatools-ui" ]]; then
  export SHOULD_RUN_E2E=true;
fi
