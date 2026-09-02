// @flow

import nock from 'nock'

import ActiveProjectViewer from '../ActiveProjectViewer'
import mockData from '../../../../__tests__/test-utils/mock-data'

const {store} = mockData

describe('lib > manager > ActiveProjectViewer', () => {
  it('should render with newly created project', () => {
    const mockState = store.getMockStateWithProject()
    const projectId = 'mock-project-id'
    const serverUrl = 'http://localhost:4000'
    // mock for fetching project
    nock(serverUrl)
      .get(`/api/manager/secure/deploymentSummaries?projectId=${projectId}`)
      .reply(200, [mockData.manager.mockDeploymentSummary])

    expect(
      store.mockWithProvider(
        ActiveProjectViewer,
        mockState.routing,
        mockState
      ).snapshot()
    ).toMatchSnapshot()
  })
})
