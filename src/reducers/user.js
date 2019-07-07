const SET_USER_LOGIN_STATE = 'scratch-gui/user/SET_USER_LOGIN_STATE';
const SAVE_USER_INFO = 'scratch-gui/user/SAVE_USER_INFO';

const SET_USER_AUTHOR = 'scratch-gui/user/SET_USER_AUTHOR';

const initialState = {
    isLogin: false,
    isAuthor: false,
    userInfo: {}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SAVE_USER_INFO:{
        state.info = action.info;
        return state;
    }
    case SET_USER_LOGIN_STATE:{
        state.isLogin = true;
        return;
    }
    case SET_USER_AUTHOR:{
        state.isAuthor = true;
        return;
    }
    default:{
        break;
    }
    }
};

const saveUserInfo = data => ({
    type: SAVE_USER_INFO,
    info: {
        data
    }
});

const setUserLoginState = () => ({
    type: SET_USER_LOGIN_STATE
});

const setUserAuthor = () => ({
    type: SET_USER_AUTHOR
});

export {
    reducer as default,
    initialState as userInitialState,
    saveUserInfo,
    setUserAuthor,
    setUserLoginState
};
