import Icon from '@conveyal/woonerf/components/icon'
import Rcslider from 'rc-slider'
import React, {PropTypes, Component} from 'react'
import {Row, Col, Button, ControlLabel} from 'react-bootstrap'

import fileDownload from '../../../common/util/file-download'
import ActiveDateTimeFilter from '../reporter/containers/ActiveDateTimeFilter'

export default class FeedVersionAccessibility extends Component {
  static propTypes = {
    version: PropTypes.object
  }

  _downloadIsochrones = () => {
    const {version} = this.props
    // TODO: add shapefile download (currently shp-write does not support isochrones)
    // downloadAsShapefile(version.isochrones, {folder: 'isochrones', types: {line: 'isochrones'}})
    fileDownload(JSON.stringify(version.isochrones), `isochrones_${version.feedSource.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`)
  }

  _formatSliderTips = (value) => {
    return `${value} minutes`
  }

  _renderIsochroneMessage () {
    const {version} = this.props
    if (version.isochrones && version.isochrones.features) {
      return <span>
        Move marker or change date/time to recalculate travel shed.<br />
        <Button
          bsStyle='success'
          bsSize='small'
          onClick={this._downloadIsochrones}>
          <Icon type='download' /> Export isochrones
        </Button>
      </span>
    } else if (version.isochrones) {
      return 'Reading transport network, please try again later.'
    } else {
      return 'Click on map above to show travel shed for this feed.'
    }
  }

  render () {
    const {version} = this.props
    return (
      <div>
        <Row>
          <Col xs={12}>
            {/* isochrone message */}
            <p className='lead text-center'>
              {this._renderIsochroneMessage(version)}
            </p>
          </Col>
        </Row>
        <Row>
          <Col
            md={6}
            mdOffset={3}
            xs={12}
            style={{marginBottom: '20px'}}>
            <ControlLabel>Travel time</ControlLabel>
            <Rcslider
              min={5}
              max={120}
              defaultValue={this.props.isochroneBand / 60}
              onChange={this.props.changeIsochroneBand}
              step={5}
              marks={{
                15: '¼ hour',
                30: '½ hour',
                60: <strong>1 hour</strong>,
                120: '2 hours'
              }}
              tipFormatter={this._formatSliderTips} />
          </Col>
        </Row>
        <ActiveDateTimeFilter version={version} />
      </div>
    )
  }
}
