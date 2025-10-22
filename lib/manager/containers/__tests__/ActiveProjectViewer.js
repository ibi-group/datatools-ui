// @flow

import ActiveProjectViewer from '../ActiveProjectViewer'
import mockData from '../../../../__tests__/test-utils/mock-data'

const {store} = mockData

describe('lib > manager > ActiveProjectViewer', () => {
  it('should render with newly created project', async () => {
    const mockState = store.getMockStateWithProject()
    const snap = await store.mockWithProvider(
      ActiveProjectViewer,
      mockState.routing,
      mockState
    ).snapshot()
    expect(snap).toMatchSnapshot()
  })
})
