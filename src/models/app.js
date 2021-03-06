import { menuList, hasPower, queryAuthority } from '../services/app';
import { makeMenu, getUserInfo, getSession, config } from '../utils/';

const { prefix } = config;
const localStorage = window.localStorage;
const document = window.document;
const location = window.location;
const winWidth = window.innerWidth || document.documentElement.clientWidth
                  || document.body.clientWidth;

export default {
  namespace: 'app',
  state: {
    identity: '',
    user: {},
    isLogin: false,
    permissions: {
      visit: {
        admin: ['1', '2', '3', '4', '5'],
        teacher: ['1', '2', '3'],
        student: ['1', '2'],
      },
    },
    adminMenu: [
      {
        id: '1',
        icon: 'laptop',
        name: '首页',
        route: '/admin/home',
      },
      {
        id: '2',
        icon: 'bulb',
        name: '实验管理',
        route: '/admin/experiment',
      },
      {
        id: '3',
        icon: 'user',
        name: '教师管理',
        route: '/admin/teacher',
      },
      {
        id: '4',
        icon: 'team',
        name: '学生管理',
        route: '/admin/student',
      },
      {
        id: '5',
        icon: 'fork',
        name: '个人信息',
        route: '/admin/personal',
      },
    ],
    teacherMenu: [
      {
        id: '1',
        icon: 'laptop',
        name: '首页',
        route: '/teacher/home',
      },
      {
        id: '2',
        icon: 'book',
        name: '我的实验',
        route: '/teacher/myExperiment',
      },
      {
        id: '3',
        mpid: '-1',
        icon: 'book',
        name: '实验详情',
        route: '/teacher/experiment/:itemId',
      },
    ],
    studentMenu: [
      {
        id: '1',
        icon: 'laptop',
        name: '首页',
        route: '/student/home',
      },
      {
        id: '2',
        icon: 'book',
        name: '我的实验',
        route: '/student/myExperiment',
      },
    ],
    menuPopoverVisible: false,
    siderFold: localStorage.getItem(`${prefix}siderFold`) === 'true',
    darkTheme: false, // 风格定为白色
    isNavbar: winWidth < 769,
    navOpenKeys: JSON.parse(localStorage.getItem(`${prefix}navOpenKeys`)) || [],
  },
  subscriptions: {
    setup({ dispatch }) {
      let tid;
      const user = getSession('user');
      window.onresize = () => {
        clearTimeout(tid);
        tid = setTimeout(() => {
          dispatch({ type: 'changeNavbar' });
        }, 300);
      };
      dispatch({
        type: 'updateState',
        payload: {
          user: JSON.parse(user) || {},
        },
      });
    },
  },
  effects: {
    * changeNavbar({ payload }, { put, select }) {
      const { report } = yield (select(_ => _));
      const isNavbar = winWidth < 769;
      if (isNavbar !== report.isNavbar) {
        yield put({ type: 'handleNavbar', payload: isNavbar });
      }
    },

    // 登陆检测
    * checkLogin() {
      const isLogin = yield getSession('isLogin');
      if (!isLogin || isLogin !== 'yes') {
        window.location = `${location.origin}/index.html#/login`;
      }
    },


    * getMenuList(payload, { put, call }) {
      const { data } = yield call(menuList);
      // 有菜单权限 并且 已经完善商户信息 才展示菜单
      if (data.success && getUserInfo().tenName) {
        yield put({
          type: 'showMenu',
          menuData: makeMenu(data.data),
        });
      } else {
        yield put({ type: 'hideMenu' });
      }
    },
    * queryAuthority(payload, { put, call }) {
      const { data } = yield call(queryAuthority);
      if (data.success) {
        if (data.data.status === 2) {
          yield put({
            type: 'hideMenu',
          });
        } else {
          yield put({
            type: 'showMenus',
          });
          yield put({
            type: 'getMenuList',
          });
        }
      }
    },

    * getPower(payload, { call, put }) {
      const { data } = yield call(hasPower);

      if (data.success) {
        yield put({
          type: 'showItem',
          hasItemPower: (data.data === 1),
        });
      }
    },
  },
  reducers: {
    showLoading(state) {
      return { ...state, loading: true };
    },
    hideLoading(state) {
      return { ...state, loading: false };
    },
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },

    switchSider(state) {
      localStorage.setItem(`${prefix}siderFold`, !state.siderFold);
      return {
        ...state,
        siderFold: !state.siderFold,
      };
    },

    switchTheme(state) {
      localStorage.setItem(`${prefix}darkTheme`, !state.darkTheme);
      return {
        ...state,
        darkTheme: !state.darkTheme,
      };
    },

    switchMenuPopver(state) {
      return {
        ...state,
        menuPopoverVisible: !state.menuPopoverVisible,
      };
    },

    handleNavbar(state, { payload }) {
      return {
        ...state,
        isNavbar: payload,
      };
    },

    handleNavOpenKeys(state, { payload: navOpenKeys }) {
      return {
        ...state,
        ...navOpenKeys,
      };
    },
    querySuccess(state, action) {
      return { ...state, ...action.payload, loading: false };
    },
  },
};
