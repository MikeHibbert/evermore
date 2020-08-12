import React, { Component } from 'react';

class Auth extends Component {
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

    this.props.onAuth(this.state.LoginForm.email.value, this.state.LoginForm.password.value);
  }

  onChange(event) {
    const wallet_address_files = event.target.files;
    // this.setState({wallet_address: wallet_address});
    
    this.props.setWalletAddress(wallet_address_files);
  }   

  render() {

    let form = <input type="file" name="keyfile" className="btn btn-default " onChange={(e) => this.onChange(e)} />;

    if(this.props.loading) {
      form = <span>Loading your wallet ...</span>
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
            <h3>Login with your AR wallet</h3>
            <section>Select your <strong>AR wallet</strong> file to access your data through our web client.</section>
              {form}
            </div>

            <div className="row">

              <div className="col-12 col-md-6 mt-4">
                <button type="submit" className="btn btn-primary btn-block transition-hover-top">
                  Sign In
                </button>
              </div>

              <div className="col-12 col-md-6 mt-4 text-align-end text-center-xs">
              <a href="https://tokens.arweave.org/" target="_blank">Need some FREE AR tokens?</a>
              </div>

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
