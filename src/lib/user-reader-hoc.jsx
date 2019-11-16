/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import Cookies from 'js-cookie';
import axios from 'axios';

import {
    setUserLoginState,
    saveUserInfo
    // setUserAuthor
} from '../reducers/user';
import {
    getIsFetchingWithId
} from '../reducers/project-state';

const UserReaderHoc = function (WrappedComponent) {
    class UserReaderComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this,
                ['fetchUser']);
        }
        componentDidUpdate (prevProps) {
            if (this.props.isFetchingWithId && !prevProps.isFetchingWithId) {
                // this.fetchUserInfo();
                this.fetchUser();
            }
        }
        fetchUser () {
            if (Cookies.get('clipauth_rts')) {
                if (Cookies.get('clipauth_ats') && Cookies.get('clipuservice_info')){
                // The user has logined
                    this.props.setUserLoginState();
                    this.props.saveUserInfo(JSON.parse(Cookies.get('clipuservice_info')));
                } else {
                    if (!Cookies.get('clipauth_ats')){
                        axios
                            .$post(`http://localhost:7001/v1/auth/accesstoken`, {
                                refresh_token: Cookies.get('clipauth_rts')
                            })
                            .then(response => {
                                Cookies.set('clipauth_ats', response.return_data, {
                                    path: '/',
                                    maxAge: 60 * 60 * 4
                                });
                            });
                    }
                    axios
                        .$get(`http://localhost:7001/v1/user/showself`)
                        .then(response => {
                            const userData = response.return_data;
                            Cookies.set('clipuservice_info', userData, {
                                path: '/',
                                maxAge: 60 * 60 * 4
                            });
                        });
                    this.props.setUserLoginState();
                    this.props.saveUserInfo(JSON.parse(Cookies.get('clipuservice_info')));
                }
            }
        }
        render () {
            return (
                <WrappedComponent
                    {...this.props}
                />
            );
        }
    }
    UserReaderComponent.propTypes = {
        isFetchingWithId: PropTypes.bool,
        saveUserInfo: PropTypes.func,
        setUserLoginState: PropTypes.func
    };
    const mapStateToProps = state => ({
        userInfo: state.scratchGui.user.userInfo,
        isFetchingWithId: getIsFetchingWithId(state.scratchGui.projectState.loadingState)
    });
    const mapDispatchToProps = dispatch => ({
        setUserLoginState: () => dispatch(setUserLoginState()),
        saveUserInfo: userData => dispatch(saveUserInfo(userData))
    });
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(UserReaderComponent));
};
export {
    UserReaderHoc as default
};
