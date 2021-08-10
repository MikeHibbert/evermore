import React, { Component } from 'react';

class Auth extends Component {
  state = {
    loading: false
  }
  componentWillMount() {
    this.props.expandContentArea();
  }

  inputChangedHandler(event, inputIdentifier) {
    const updatedLoginForm = {
      ...this.state.LoginForm,
      [inputIdentifier]: {
        ...this.state.LoginForm[inputIdentifier],
        value: event.target.value,
        valid: this.checkValidity(event.target.value, this.state.LoginForm[inputIdentifier].validation),
        touched: true
      }
    }

    this.setState({LoginForm: updatedLoginForm});
  }

  LoginHandler(event) {
    event.preventDefault();

    this.setState({loading: true});
    try {
      this.props.setWalletAddress();
    } catch (e) {
      this.setState({loading: false});
    }
  }

  render() {

    let form = <input type="submit" name="keyfile" className="btn btn-success mt-3" value="Connect MetaMask" />;

    if(this.state.loading) {
      form = <img style={{ height: '320px' }} src="images/spinner-dark.svg" />;
    }

    return (<div className="wrapper">
    <div className="d-lg-flex text-white min-h-100vh aside-primary">

      <div className="col-12 col-lg-5 d-lg-flex">
        <div className="w-100 align-self-center">


          <div className="py-7">
            <h1 className="d-inline-block text-align-end text-center-md text-center-xs display-4 h2-xs w-100 max-w-600 w-100-md w-100-xs">
              Sign in
              <span className="display-3 h1-xs d-block font-weight-medium">
                Evermore
              </span>
            </h1>
          </div>


        </div>
      </div>


      <div className="col-12 col-lg-7 d-lg-flex">
        <div className="w-100 align-self-center text-center-md text-center-xs py-2">
          <form noValidate="" onSubmit={(event) => this.LoginHandler(event)} className="bs-validate p-5 py-6 rounded d-inline-block bg-white text-dark w-100 max-w-600">
            <div className="form-label-group mb-3">
              <h3>Connect to login</h3> 
              {form}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
    );
  }
}


export default Auth;
