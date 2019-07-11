import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import Cookies from 'js-cookie';

import {
    setUserLoginState,
    saveUserInfo,
    setUserAuthor
} from '../reducers/user';

const UserReaderHoc = function (WrappedComponent){
    class ProjectFetcherComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this,
                ['fetchUser']);
        }
    }
    componentDidUpdate (prevProps) {
        fetchUser()
    }
    fetchUser(){
        if(Cookies.get('clipauth_ats')){
            // The user has logined
            setUserLoginState()
        }
    }
};

export {
    UserReaderHOC as default
};
