// @flow

import { connect } from 'react-redux';
import { compose } from 'redux';
import prepare from 'app/utils/prepare';
import { push } from 'connected-react-router';
import UserSettings from './components/UserSettings';
import loadingIndicator from 'app/utils/loadingIndicator';
import { selectUserByUsername } from 'app/reducers/users';
import {
  fetchUser,
  updateUser,
  updatePicture,
  deleteUser,
  changePassword,
  removePicture,
} from 'app/actions/UserActions';

const loadData = (
  {
    match: {
      params: { username },
    },
  },
  dispatch
) => dispatch(fetchUser(username));

const mapStateToProps = (state, props) => {
  const {
    isMe,
    match: { params },
  } = props;
  const username = isMe ? state.auth.username : params.username;
  const user = selectUserByUsername(state, { username });
  return {
    user,
    isMe,
    initialValues: {
      ...user,
      isAbakusMember: user && user.isAbakusMember.toString(),
    },
  };
};

const mapDispatchToProps = {
  updateUser,
  updatePicture,
  deleteUser,
  changePassword,
  push,
  removePicture,
};

export default compose(
  prepare(loadData),
  connect(mapStateToProps, mapDispatchToProps),
  loadingIndicator(['user'])
)(UserSettings);
