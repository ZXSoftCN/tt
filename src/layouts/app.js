/* global window */
/* global document */
import React from 'react'
import NProgress from 'nprogress'
import PropTypes from 'prop-types'
import pathToRegexp from 'path-to-regexp'
import { connect } from 'dva'
import { Loader, MyLayout } from 'components'
import { BackTop, Layout } from 'antd'
import { classnames, config } from 'utils'
import { Helmet } from 'react-helmet'
import { withRouter } from 'dva/router'
import Error from '../pages/404'
import '../themes/index.less'
import './app.less'

const { Content, Footer, Sider } = Layout
const { Header, Bread, styles } = MyLayout
const { prefix, openPages } = config

let lastHref

const App = ({
  children, dispatch, app, loading, location,
}) => {
  const {
    user, siderFold, darkTheme, isNavbar, menuPopoverVisible, navOpenKeys, menu, permissions,
  } = app
  let { pathname } = location
  pathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  const { iconFontJS, iconFontCSS, logo } = config

  //闭包循环检查是否被授权
  const checkAuthority = (menu,selItem) => {
    let rlt = false

    const cyclicCheck = (menu,selItem) => {
      let currRlt = selItem ? menu.some(item => item.id === selItem.id): false
      if (currRlt) {
        rlt = currRlt
      }else{
        menu.forEach(item => {
          if (item.subMenus) {
            cyclicCheck(item.subMenus,selItem)
          }
        })
      }
    }
    cyclicCheck(menu,selItem)
    return rlt
  }

  //闭包从菜单树中循环找出当前路由菜单
  const findMenu = (menu,pathname) => {

    const cyclicCall = (menu,pathname) => {
      let currRlt = menu.filter(item => pathToRegexp(item.pathKey || '').exec(pathname))
      if (currRlt.length) {
        current = currRlt[0]
      }else{
        menu.forEach(item => {
          if (item.subMenus) {
            cyclicCall(item.subMenus,pathname)
          }
        })
      }
    }
    cyclicCall(menu,pathname)
    return current
  }

  // const current = menu.filter(item => pathToRegexp(item.pathKey || '').exec(pathname))
  let current = findMenu(menu,pathname)
  // const existsMenuIds = permissions.filter(item => item.id === current[0].id)
  // const hasPermission = current.length ? permissions.visit.includes(current[0].id) : false
  // const hasPermission = current.length ? permissions.some(item => item.id === current[0].id): false
  const hasPermission = checkAuthority(menu,current)
  const { href } = window.location

  if (lastHref !== href) {
    NProgress.start()
    if (!loading.global) {
      NProgress.done()
      lastHref = href
    }
  }

  const headerProps = {
    menu,
    user,
    location,
    siderFold,
    isNavbar,
    menuPopoverVisible,
    navOpenKeys,
    switchMenuPopover () {
      dispatch({ type: 'app/switchMenuPopver' })
    },
    logout () {
      dispatch({ type: 'app/logout' })
    },
    switchSider () {
      dispatch({ type: 'app/switchSider' })
    },
    changeOpenKeys (openKeys) {
      dispatch({ type: 'app/handleNavOpenKeys', payload: { navOpenKeys: openKeys } })
    },
  }

  const siderProps = {
    menu,
    location,
    siderFold,
    darkTheme,
    navOpenKeys,
    changeTheme () {
      dispatch({ type: 'app/switchTheme' })
    },
    changeOpenKeys (openKeys) {
      window.localStorage.setItem(`${prefix}navOpenKeys`, JSON.stringify(openKeys))
      dispatch({ type: 'app/handleNavOpenKeys', payload: { navOpenKeys: openKeys } })
    },
  }

  const breadProps = {
    menu,
    location,
  }

  if (openPages && openPages.includes(pathname)) {
    return (<div>
      <Loader fullScreen spinning={loading.effects['app/query']} />
      {children}
    </div>)
  }

  return (
    <div>
      <Loader fullScreen spinning={loading.effects['app/query']} />
      <Helmet>
        <title>泛泛家园</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href={logo} type="image/x-icon" />
        {iconFontJS && <script src={iconFontJS} />}
        {iconFontCSS && <link rel="stylesheet" href={iconFontCSS} />}
      </Helmet>

      <Layout className={classnames({ [styles.dark]: darkTheme, [styles.light]: !darkTheme })}>
        {!isNavbar && <Sider
          trigger={null}
          collapsible
          collapsed={siderFold}
        >
          {siderProps.menu.length === 0 ? null : <MyLayout.Sider {...siderProps} />}
        </Sider>}
        <Layout style={{ height: '100vh', overflow: 'scroll' }} id="mainContainer">
          <BackTop target={() => document.getElementById('mainContainer')} />
          <Header {...headerProps} />
          <Content>
            <Bread {...breadProps} />
            {hasPermission ? children : <Error />}
          </Content>
          <Footer >
            {config.footerText}
          </Footer>
        </Layout>
      </Layout>
    </div>
  )
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  app: PropTypes.object,
  loading: PropTypes.object,
}

export default withRouter(connect(({ app, loading }) => ({ app, loading }))(App))
