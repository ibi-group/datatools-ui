import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {OverlayTrigger, Tooltip} from 'react-bootstrap'

export default class SidebarNavItem extends Component {
  static propTypes = {
    active: PropTypes.bool,
    expanded: PropTypes.bool,
    icon: PropTypes.string,
    label: PropTypes.string,
    onClick: PropTypes.func,
    image: PropTypes.string,
    link: PropTypes.string
  }

  state = {
    hover: false
  }

  toggleHover = () => {
    this.setState({ hover: !this.state.hover })
  }

  render () {
    const {
      active,
      expanded,
      image,
      icon,
      loading,
      label,
      link,
      onClick
    } = this.props
    const activeColor = active
      ? '#fff'
      : this.state.hover
      ? '#fff'
      : '#ccc'

    const containerStyle = {
      paddingTop: 10,
      paddingBottom: 10,
      paddingRight: expanded ? 10 : 10,
      paddingLeft: 10,
      marginTop: 5,
      marginBottom: 5,
      marginLeft: -15,
      cursor: 'pointer',
      color: activeColor,
      borderLeft: active ? '4px solid #2889CA' : '4px solid rgba(0,0,0,0)',
      textDecoration: 'none',
      borderRight: active ? '5px solid rgba(0,0,0,0)' : '5px solid rgba(0,0,0,0)',
      backgroundColor: active ? '#313131' : 'rgba(0,0,0,0)'
    }

    const labelStyle = {
      fontWeight: 'bold',
      marginTop: 3,
      fontSize: 12,
      marginLeft: 30
    }

    const containerProps = {
      onMouseEnter: this.toggleHover,
      onMouseLeave: this.toggleHover,
      onClick: !link && onClick
    }
    const container = (
      <div
        style={containerStyle}
        {...containerProps}>
        <NavIcon
          icon={icon}
          image={image}
          loading={loading} />
        {expanded
          ? <div style={labelStyle}>{label}</div>
          : null
        }
        <div style={{ clear: 'both' }} />
      </div>
    )
    const navItem = link
      ? <Link to={link} style={{textDecoration: 'none'}}>
        {container}
      </Link>
      : container
    return expanded
      ? navItem
      : <OverlayTrigger
        overlay={expanded ? null : <Tooltip id={label}>{label}</Tooltip>}>
        {navItem}
      </OverlayTrigger>
  }
}

class NavIcon extends Component {
  render () {
    const {icon, image, loading} = this.props

    const iconContainerStyle = {
      width: 20,
      height: 20,
      textAlign: 'center',
      float: 'left'
    }

    const imageContainerStyle = {
      width: 30,
      height: 30,
      textAlign: 'center',
      float: 'left'
    }
    const classes = loading
      ? 'fa-spin fa-lg'
      : 'fa-lg'
    return image
      ? <div style={imageContainerStyle}>
        <img alt='App logo' width={40} height={40} src={image} />
      </div>
      : <div style={iconContainerStyle}>
        <Icon
          type={icon}
          size='lg'
          ref='icon'
          className={classes} />
      </div>
  }
}
