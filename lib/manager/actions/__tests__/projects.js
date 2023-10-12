// @flow

import nock from 'nock'

import mockData from '../../../../__tests__/test-utils/mock-data'
import * as projectsActions from '../projects'

const {
  getMockInitialState,
  getMockStateWithAdminUser,
  makeMockStore
} = mockData.store

describe('manager > actions > projects >', () => {
  it('should set a new feed source sort order', () => {
    const store = makeMockStore(getMockInitialState())
    store.dispatch(projectsActions.setFeedSort('alphabetically-desc'))
    store.expectStateToMatchSnapshot('projects')
  })

  it('should load a project and associated data', async () => {
    const projectId = 'mock-project-with-deployments-id'
    const serverUrl = 'http://localhost:4000'
    // mock for fetching project
    nock(serverUrl)
      .get(`/api/manager/secure/project/${projectId}`)
      .reply(200, mockData.manager.mockProjectWithDeploymentUnloaded)
      // mock for fetching project feeds
      .get(`/api/manager/secure/feedsource?projectId=${projectId}`)
      .reply(200, [mockData.manager.mockFeedWithVersion])
      // mock for fetching the project deployments
      .get(`/api/manager/secure/deployments?projectId=${projectId}`)
      .reply(200, [mockData.manager.mockDeployment])
      .get(`/api/manager/secure/deploymentSummaries?projectId=${projectId}`)
      .reply(200, [mockData.manager.mockDeploymentSummary])

    const store = makeMockStore(getMockStateWithAdminUser())
    await store.dispatch(
      projectsActions.onProjectViewerMount(projectId)
    )
    store.expectStateToMatchSnapshot('projects')
  })
})
