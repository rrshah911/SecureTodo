import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
}

const userPool = new CognitoUserPool(poolData)

export const auth = {
  async signUp(email: string, password: string) {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ]

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      })
    })
  },

  async confirmSignUp(email: string, code: string) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      })
    })
  },

  async resendCode(email: string) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      })
    })
  },

  async signIn(email: string, password: string) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      })

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result)
        },
        onFailure: (err) => {
          reject(err)
        },
      })
    })
  },

  async getCurrentUser() {
    return new Promise<CognitoUserSession | null>((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()
      
      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: any, session: CognitoUserSession) => {
        if (err) {
          resolve(null)
          return
        }
        
        if (!session.isValid()) {
          resolve(null)
          return
        }
        
        resolve(session)
      })
    })
  },

  async getToken() {
    const session = await this.getCurrentUser()
    return session?.getAccessToken().getJwtToken() || null
  },

  signOut() {
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
  }
} 