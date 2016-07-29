// Based on https://github.com/YoruNoHikage/redux-devtools-dispatch

import React, { Component, PropTypes } from 'react';
import * as themes from 'redux-devtools-themes';

const styles = {
  button: {
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '3px',
    padding: '3px',
    margin: '5px',
    fontSize: '0.8em',
    textDecoration: 'none',
    border: 'none',
  },
  content: {
    margin: '5px',
    padding: '5px',
    borderRadius: '3px',
    outline: 'none',
    flex: '1 1 80%',
    overflow: 'auto',
  },
  label: {
    margin: '5px',
    padding: '5px',
    flex: '1 1 20%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    direction: 'rtl',
    textAlign: 'left',
  }
};

export default class Dispatcher extends Component {
  static propTypes = {
    initEmpty: PropTypes.bool,
    store: PropTypes.object.isRequired,
    theme: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
    ]),
    error: PropTypes.string
  };

  static defaultProps = {
    theme: 'nicinabox',
    initEmpty: false
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      selectedActionCreator: 'default',
      args: []
    };
  }

  selectActionCreator(e) {
    const selectedActionCreator = e.target.value;
    let args = [];
    if (selectedActionCreator !== 'default') {
      // Shrink the number args to the number of the new ones
      args = this.state.args.slice(
        0, this.props.store.getActionCreators()[selectedActionCreator].args.length
      );
    }
    this.setState({
      selectedActionCreator,
      args
    });
  }

  handleArg(e, argIndex) {
    const args = [
      ...this.state.args.slice(0, argIndex),
      this.refs['arg' + argIndex].textContent,
      ...this.state.args.slice(argIndex + 1),
    ];
    this.setState({ args });
  }

  launchAction() {
    if (this.state.selectedActionCreator !== 'default') {
      let rest = this.refs.restArgs.textContent.trim();
      if (rest === '') rest = undefined;
      this.props.store.dispatch({
        selected: this.state.selectedActionCreator,
        args: this.state.args.filter(arg => arg.trim() !== ''),
        rest
      });
    } else {
      if (this.refs.action.textContent !== '') {
        this.props.store.dispatch(this.refs.action.textContent);
      }
    }
  }

  componentDidMount() {
    this.resetCustomAction();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.selectedActionCreator === 'default' &&
      prevState.selectedActionCreator !== 'default'
    ) {
      this.resetCustomAction();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.selectedActionCreator !== 'default' && !nextProps.store.getActionCreators()) {
      this.setState({
        selectedActionCreator: 'default',
        args: []
      });
    }
  }

  resetCustomAction() {
    this.refs.action.innerHTML = this.props.initEmpty ? '<br/>' : '{<br/>type: \'\'<br/>}';
  }

  getTheme() {
    let { theme } = this.props;
    if (typeof theme !== 'string') {
      return theme;
    }

    if (typeof themes[theme] !== 'undefined') {
      return themes[theme];
    }

    console.warn('DevTools theme ' + theme + ' not found, defaulting to nicinabox');
    return themes.nicinabox;
  }

  render() {
    const theme = this.getTheme();
    const contentEditableStyle = {
      ...styles.content, color: theme.base06, backgroundColor: theme.base00
    };
    const buttonStyle = {
      ...styles.button, color: theme.base06, backgroundColor: theme.base00
    };
    const actionCreators = this.props.store.getActionCreators();

    let fields = <div contentEditable style={contentEditableStyle} ref="action"></div>;
    if (this.state.selectedActionCreator !== 'default' && actionCreators) {
      const fieldStyles = { ...styles.label, color: theme.base06 };
      fields = actionCreators[this.state.selectedActionCreator].args.map((param, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <span style={fieldStyles}>{param}</span>
          <div
            contentEditable style={contentEditableStyle} ref={'arg' + i}
            onInput={(e) => this.handleArg(e, i)}
          />
        </div>
      ));
      fields.push(
        <div key="action" style={{ display: 'flex' }}>
          <span style={fieldStyles}>rest...</span>
          <div contentEditable style={contentEditableStyle} ref="restArgs" />
        </div>
      );
    }

    let error;
    if (this.props.error) {
      error = (
        <div style={{ color: theme.base06, background: '#FC2424', padding: '5px', display: 'flex' }}>
          <div style={{ flex: '1', alignItems: 'center' }}>
            <p style={{ margin: '0px' }}>{this.state.error}</p>
          </div>
          <div style={{ alignItems: 'center' }}>
            <button
              onClick={() => this.setState({ error: null })}
              style={{ ...buttonStyle, margin: '0', background: '#DC2424' }}
            >&times;</button>
          </div>
        </div>
      );
    }

    let dispatchButtonStyle = buttonStyle;
    if (!actionCreators || actionCreators.length <= 0) {
      dispatchButtonStyle = {
        ...buttonStyle,
        position: 'absolute',
        bottom: '3px',
        right: '5px',
        background: theme.base02,
      };
    }

    const dispatchButton = (
      <button style={dispatchButtonStyle} onClick={this.launchAction.bind(this)}>Dispatch</button>
    );

    return (
      <div
        style={{
          background: theme.base02,
          fontFamily: 'monaco,Consolas,Lucida Console,monospace',
          position: 'relative'
        }}
      >
        {error}
        {fields}
        {actionCreators && actionCreators.length > 0 ? <div style={{ display: 'flex' }}>
          <select
            onChange={this.selectActionCreator.bind(this)}
            style={{ flex: '1', fontFamily: 'inherit', margin: '5px 0 0 5px', fontSize: '1.1em' }}
            defaultValue={this.state.selectedActionCreator || 'default'}
          >
            <option value="default">Custom action</option>
            {actionCreators.map(({ name, func, args }, i) => (
              <option key={i} value={i}>
                {name + '(' + args.join(', ') + ')'}
              </option>
            ))}
          </select>
          {dispatchButton}
        </div> : dispatchButton}
      </div>
    );
  }
}