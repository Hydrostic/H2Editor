/* eslint-disable max-len */
import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import axios from 'axios';

import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsCreatingNew,
    getIsFetchingWithId,
    getIsLoading,
    getIsShowingProject,
    onFetchedProjectData,
    projectError,
    setProjectId
} from '../reducers/project-state';
import {
    setUserAuthor
} from '../reducers/user';
import {
    activateTab,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';

import log from './log';
import storage from './storage';

/* Higher Order Component to provide behavior for loading projects by id. If
 * there's no id, the default project is loaded.
 * @param {React.Component} WrappedComponent component to receive projectData prop
 * @returns {React.Component} component with project loading behavior
 */
const ProjectFetcherHOC = function (WrappedComponent) {
    class ProjectFetcherComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'fetchProject'
            ]);
            this.state = {
                projectTitle: '',
                canRemix: false,
                enableCommunity: false,
                canSave: false,
                canEditTitle: false
            };
            storage.setProjectHost(props.projectHost);
            storage.setAssetHost(props.assetHost);
            storage.setTranslatorFunction(props.intl.formatMessage);
            // props.projectId might be unset, in which case we use our default;
            // or it may be set by an even higher HOC, and passed to us.
            // Either way, we now know what the initial projectId should be, so
            // set it in the redux store.
            if (
                props.projectId !== '' &&
                props.projectId !== null &&
                typeof props.projectId !== 'undefined'
            ) {
                this.props.setProjectId(props.projectId.toString());
            }
        }
        componentDidUpdate (prevProps) {
            if (prevProps.projectHost !== this.props.projectHost) {
                storage.setProjectHost(this.props.projectHost);
            }
            if (prevProps.assetHost !== this.props.assetHost) {
                storage.setAssetHost(this.props.assetHost);
            }
            if (this.props.isFetchingWithId && !prevProps.isFetchingWithId) {
                // this.fetchUserInfo();
                this.fetchProject(this.props.reduxProjectId, this.props.loadingState);
            }
            if (this.props.isShowingProject && !prevProps.isShowingProject) {
                this.props.onProjectUnchanged();
            }
            if (this.props.isShowingProject && (prevProps.isLoadingProject || prevProps.isCreatingNew)) {
                this.props.onActivateTab(BLOCKS_TAB_INDEX);
            }
        }
        fetchProject (projectId, loadingState) {
            if (projectId !== '' &&
                projectId !== null &&
                typeof projectId !== 'undefined' && projectId.toString() !== '0'){
                return axios.get(`http://localhost:7001/v1/project/read/${parseInt(projectId, 10)}`)
                    .then(response => {
                        switch (response.data.message) {
                        case 'Project Not Exists':
                            throw new Error('Could not find project');
                        case 'Permission denied by project policy':
                            throw new Error('Permission denied by project policy');
                        default:
                            {
                                const projectStorageName = response.data.return_data.project_storage_name || response.data.return_data.record_storage_name;
                                storage
                                    .load(storage.AssetType.Project, projectStorageName, storage.DataFormat.JSON)
                                    .then(projectAsset => {
                                        if (projectAsset) {
                                            this.setState({enableCommunity: true});
                                            if (this.props.isLogin){
                                                this.setState({canEditTitle: true});
                                                if (this.props.userInfo.data.user_id === response.data.return_data.project_author){
                                                    this.props.setUserAuthor();
                                                    this.setState({canSave: true});
                                                } else {
                                                    this.setState({canRemix: true});
                                                }
                                            }
                                            this.props.onUpdateProjectTitle(response.data.return_data.project_name);
                                            this.props.onFetchedProjectData(projectAsset.data, loadingState);
                                            // TODO: 结合用户来判断是否可以 remix，如果当前用户即为作品用户，则不可 remix，但未发布，则可 share
                                        } else {
                                            // Treat failure to load as an error
                                            // Throw to be caught by catch later on
                                            throw new Error('Could not find project');
                                        }
                                    })
                                    .catch(err => {
                                        this.props.onError(err);
                                        log.error(err);
                                    });
                            }
                            break;
                        }
                    })
                    .catch(err => {
                        this.props.onError(err);
                        log.error(err);
                    });
            }
            return storage
                .load(storage.AssetType.Project, projectId, storage.DataFormat.JSON)
                .then(projectAsset => {
                    if (projectAsset) {
                        if (this.props.isLogin){
                            this.setState({canEditTitle: true});
                            this.setState({canSave: true});
                        }
                        this.props.onFetchedProjectData(projectAsset.data, loadingState);
                    } else {
                        // Treat failure to load as an error
                        // Throw to be caught by catch later on
                        throw new Error('Could not find project');
                    }
                })
                .catch(err => {
                    this.props.onError(err);
                    log.error(err);
                });
            
                
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                assetHost,
                intl,
                isLoadingProject: isLoadingProjectProp,
                loadingState,
                onActivateTab,
                onError: onErrorProp,
                onFetchedProjectData: onFetchedProjectDataProp,
                onProjectUnchanged,
                projectHost,
                projectId,
                reduxProjectId,
                setProjectId: setProjectIdProp,
                /* eslint-enable no-unused-vars */
                isFetchingWithId: isFetchingWithIdProp,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    canEditTitle={this.state.anEditTitle}
                    canRemix={this.state.canRemix}
                    canSave={this.state.canSave}
                    enableCommunity={this.state.enableCommunity}
                    fetchingProject={isFetchingWithIdProp}
                    {...componentProps}
                />
            );
        }
    }
    ProjectFetcherComponent.propTypes = {
        assetHost: PropTypes.string,
        canSave: PropTypes.bool,
        intl: intlShape.isRequired,
        isCreatingNew: PropTypes.bool,
        isFetchingWithId: PropTypes.bool,
        isLoadingProject: PropTypes.bool,
        isLogin: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onActivateTab: PropTypes.func,
        onError: PropTypes.func,
        onFetchedProjectData: PropTypes.func,
        onProjectUnchanged: PropTypes.func,
        onUpdateProjectTitle: PropTypes.func,
        projectHost: PropTypes.string,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        // eslint-disable-next-line react/sort-prop-types
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func,
        setUserAuthor: PropTypes.func,
        userInfo: PropTypes.object
    };
    ProjectFetcherComponent.defaultProps = {
        assetHost: 'https://assets.scratch.mit.edu',
        projectHost: 'https://clipteam-project.oss-cn-shanghai.aliyuncs.com'
    };

    const mapStateToProps = state => ({
        isCreatingNew: getIsCreatingNew(state.scratchGui.projectState.loadingState),
        isFetchingWithId: getIsFetchingWithId(state.scratchGui.projectState.loadingState),
        isLoadingProject: getIsLoading(state.scratchGui.projectState.loadingState),
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
        loadingState: state.scratchGui.projectState.loadingState,
        reduxProjectId: state.scratchGui.projectState.projectId,
        userInfo: state.session.userInfo,
        isLogin: state.session.isLogin
    });
    const mapDispatchToProps = dispatch => ({
        onActivateTab: tab => dispatch(activateTab(tab)),
        onError: error => dispatch(projectError(error)),
        onFetchedProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        setProjectId: projectId => dispatch(setProjectId(projectId)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged()),
        setUserAuthor: () => dispatch(setUserAuthor())
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(ProjectFetcherComponent));
};

export {
    ProjectFetcherHOC as default
};
