// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { ButtonGroup, Tooltip, OverlayTrigger, Button } from 'react-bootstrap'

import * as activeActions from '../actions/active'
import * as editorActions from '../actions/editor'
import * as snapshotActions from '../actions/snapshots'
import {componentToText, entityIsNew} from '../util/objects'
import type {Entity, Feed} from '../../types'
import type {EditorTables} from '../../types/reducers'
import type {ImmutableList} from '../selectors/index'

import BulkEditorModal from './BulkEditorModal'

type State = {
  showBulkEditor: boolean
}

type Props = {
  activeComponent: string,
  activeEntity: Entity,
  approveGtfsDisabled: boolean,
  cloneGtfsEntity: typeof editorActions.cloneGtfsEntity,
  createSnapshot: typeof snapshotActions.createSnapshot,
  deleteGtfsEntity: typeof activeActions.deleteGtfsEntity,
  entities: Array<Entity>,
  feedSource: Feed,
  fromIndex: ?number,
  list: ImmutableList,
  newGtfsEntity: typeof editorActions.newGtfsEntity,
  patchTable: typeof editorActions.patchTable,
  setActiveEntity: typeof activeActions.setActiveEntity,
  showConfirmModal: ({body: string, onConfirm: () => void, title: string}) => void,
  tableData: EditorTables,
  toIndex: ?number,
  updateIndexes: (?number, ?number) => void
}

export default class EntityListButtons extends Component<Props, State> {
  state = {
    showBulkEditor: false
  }

  _onClickBulk = () => this.setState({showBulkEditor: true})

  _onCloseBulk = () => this.setState({showBulkEditor: false})

  _onClickClone = () => {
    const {activeComponent, activeEntity, cloneGtfsEntity, feedSource} = this.props
    if (activeEntity.id) {
      cloneGtfsEntity(feedSource.id, activeComponent, activeEntity.id)
    } else {
      console.warn('impossible de cloner l\'entité car l\'id activeEntity n\'est pas défini.')
    }
  }

  _onClickDelete = () => {
    const {
      activeComponent,
      activeEntity,
      deleteGtfsEntity,
      feedSource,
      fromIndex,
      list,
      setActiveEntity,
      showConfirmModal,
      toIndex,
      updateIndexes
    } = this.props
    // let fromIndex, toIndex
    const type = componentToText(activeComponent)
    if (activeEntity) {
      // Show modal and delete on confirmation
      showConfirmModal({
        title: `Supprimer ${type}?`,
        body: `Êtes-vous sûr de vouloir supprimer ce ${type}?`,
        onConfirm: () => {
          if (activeEntity.id) {
            deleteGtfsEntity(feedSource.id, activeComponent, activeEntity.id)
          } else {
            console.warn('impossible de supprimer l\'entité car l\'id activeEntity n\'est pas défini.')
          }
          updateIndexes(fromIndex, toIndex)
          setActiveEntity(feedSource.id, activeComponent)
        }
      })
    } else if (typeof fromIndex === 'number' && typeof toIndex === 'number') {
      showConfirmModal({
        // FIXME: fix plural component text
        title: `Supprimer ${+toIndex - +fromIndex} ${type}s?`,
        body: `Êtes-vous sûr de vouloir supprimer ces ${toIndex - fromIndex} ${type}s?`,
        onConfirm: () => {
          for (var i = 0; i < list.length; i++) {
            if (list[i].isSelected) {
              // Delete selected entity
              deleteGtfsEntity(feedSource.id, activeComponent, list[i].id)
            }
          }
          updateIndexes(fromIndex, toIndex)
          setActiveEntity(feedSource.id, activeComponent)
        }
      })
    }
  }

  _onClickNew = () => {
    const {activeComponent, feedSource, newGtfsEntity} = this.props
    newGtfsEntity(feedSource.id, activeComponent)
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      entities,
      feedSource,
      fromIndex,
      tableData
    } = this.props
    return (
      <div>
        <ButtonGroup
          className='pull-right'>
          <Button
            bsSize='small'
            // TODO: Enable for schedule exceptions?
            disabled={activeComponent === 'scheduleexception'}
            title={`Bulk edit ${activeComponent} records`}
            data-test-id={`bulk-${activeComponent}-button`}
            onClick={this._onClickBulk}>
            <Icon type='pencil' />
          </Button>
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id={`duplicate-${activeComponent}`}>
                Duplicate {componentToText(activeComponent)}
              </Tooltip>
            }>
            <Button
              bsSize='small'
              data-test-id={`clone-${activeComponent}-button`}
              // prohibit user from creating additional duplicates when there are unsaved entities
              disabled={!activeEntity || !!entities.find(entityIsNew)}
              onClick={this._onClickClone}>
              <Icon type='clone' />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id={`delete-${activeComponent}`}>
                Delete {componentToText(activeComponent)}
              </Tooltip>
            }>
            <Button
              bsSize='small'
              data-test-id={`delete-${activeComponent}-button`}
              disabled={!activeEntity && typeof fromIndex === 'undefined'}
              onClick={this._onClickDelete}>
              <Icon type='trash' />
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
        {activeComponent === 'stop'
          ? <span className='small'>Clic-droit sur la carte pour créer un nouvel arrêt</span>
          : <Button
            bsSize='small'
            data-test-id={`new-${activeComponent}-button`}
            disabled={entities && !!entities.find(entityIsNew)}
            onClick={this._onClickNew}
            // Setting the max width based on the width of the 'New Calendar' button
            // so the button does not move to a new line in deployed systems.
            // Note the width of the button text varies depending on the font used.
            style={{maxWidth: '95.375px'}}>
            Créer {componentToText(activeComponent)}
          </Button>
        }
        <BulkEditorModal
          activeComponent={activeComponent}
          approveGtfsDisabled={this.props.approveGtfsDisabled}
          createSnapshot={this.props.createSnapshot}
          feedSource={feedSource}
          onClose={this._onCloseBulk}
          patchTable={this.props.patchTable}
          show={this.state.showBulkEditor}
          tableData={tableData} />
      </div>
    )
  }
}
