// @flow

import FeedSourceTable from '../FeedSourceTable'
import {
  restoreDateNowBehavior,
  setDefaultTestTime
} from '../../../../__tests__/test-utils'
import mockData from '../../../../__tests__/test-utils/mock-data'

const {manager, store} = mockData

describe('lib > manager > FeedSourceTable', () => {
  afterEach(restoreDateNowBehavior)

  it('should render with a project with feeds and a deployment', () => {
    setDefaultTestTime()
    const mockState = store.getMockStateWithProjectWithFeedsAndDeployment()

    expect(
      store.mockWithProvider(
        FeedSourceTable,
        {
          onNewFeedSourceClick: () => null,
          project: {
            ...manager.mockProjectWithDeployment,
            feedSources: [manager.mockFeedSourceSummaryWithVersion]
          }
        },
        mockState
      ).snapshot()
    ).toMatchSnapshot()
  })
})
