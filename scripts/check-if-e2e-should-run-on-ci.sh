# Since the e2e tests take a while to run and it could present an inconvenience
# to be making sure the e2e tests work on every single PR, only run the e2e tests on CI selectively.

echo "GitHub Repo var: $GITHUB_REPOSITORY" 
echo "GITHUB_ENV var: $GITHUB_ENV"

export TMP_REF_NAME=$GITHUB_REF_NAME
export GITHUB_REF_NAME=dependabot/npm_and_yarn/shell-quote-1.7.3
echo "Git ref name: $GITHUB_REF_NAME"

# Run e2e tests on PRs to master
if [[ "$GITHUB_BASE_REF_SLUG" = "master" ]]; then
  echo "SHOULD_RUN_E2E=true" >> $GITHUB_ENV && export SHOULD_RUN_E2E=true
  echo 'Will run E2E tests because this is a PR to master'
elif [[ "$GITHUB_REPOSITORY" = "ibi-group/datatools-ui" ]]; then
  echo "Targeting datatools-ui repo"
  # Run e2e tests on pushes to dev and master (and for checkout branches from github actions too).
  if [[ "$GITHUB_REF_SLUG" = "master" || "$GITHUB_REF_SLUG" = "dev" || "$GITHUB_REF_SLUG" = "github-actions" ]]; then
    echo "SHOULD_RUN_E2E=true" >> $GITHUB_ENV && export SHOULD_RUN_E2E=true
    echo 'Will run E2E tests because this is a commit to master or dev'
  fi
  # Also run e2e tests on automatic dependabot PR branches to dev to facilitate approval of security-related PRs.
  # We check that the branch ref starts with "dependabot/" (refs are in the format "dependabot/<module>/<package-version>").
  if [[ $GITHUB_REF_NAME = dependabot/* ]] && [[ "$GITHUB_BASE_REF_SLUG" = "dev" ]]; then
    echo "SHOULD_RUN_E2E=true" >> $GITHUB_ENV && export SHOULD_RUN_E2E=true
    echo 'Will run E2E tests because this is an automatic dependabot PR to dev'
  fi
fi

if [[ "$SHOULD_RUN_E2E" != "true" ]]; then
  echo 'Skipping E2E tests...'
fi

export GITHUB_REF_NAME=$TMP_REF_NAME

# Optionally override the conditions above with the below block:
OVERRIDE=false
echo "SHOULD_RUN_E2E=${OVERRIDE}" >> $GITHUB_ENV && export SHOULD_RUN_E2E=${OVERRIDE}
echo "Overriding E2E. Temporarily forcing to be ${OVERRIDE}..."

