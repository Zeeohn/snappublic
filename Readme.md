# API Documentation for snapme

This contains the API endpoints and basic description of their functions and responses.
Whew! It wasn't an easy job 😢.

## API Endpoints

| Path                                | Method | Description                                               |
| ----------------------------------- | ------ | --------------------------------------------------------- |
| /api/v1/login                       | POST   | Logs in a user via email and password                     |
| /api/v1/logout                      | GET    | Logs the currently signed in user out                     |
| /api/v1/signup                      | POST   | Creates a new user                                        |
| /api/v1/reset-password              | POST   | Makes a request for password change                       |
| api/v1/reset-password/:token        | POST   | Verifies the token for password reset                     |
| /api/v1/auth/facebook               | GET    | Authenticates a user using facebook                       |
| /api/v1/auth/facebook/callback      | GET    | Facebook callback that returns user data                  |
| /api/v1/auth/twitter                | GET    | Authenticates a user using twitter                        |
| /api/v1/auth/twitter/callback       | GET    | Twitter callback that returns user data                   |
| /api/v1/auth/instagram              | GET    | Authenticates a user using instagram                      |
| /api/v1/auth/instagram/callback     | GET    | instagram callback that returns user data                 |
| /api/v1/auth/google                 | GET    | Authenticates a user using googler                        |
| /api/v1/auth/google/callback        | GET    | Google callback that returns user data                    |
| /api/v1/:username                   | GET    | Gets a user by their username                             |
| /api/v1/user/profile                | GET    | Gets the profile page of the currently signed in user     |
| /update-profile/:username           | PATCH  | Finds a user by their username and update profile details |
| /api/v1/:username/follow            | PUT    | Finds a user by their username and follows the user       |
| /api/v1/:username/unfollow          | PUT    | Finds a user by their username and unfollows the user     |
| /api/v1/account/delete              | DELETE | Deletes the account of the currently signed in user       |
| /api/v1/create-pin/:catalog         | POST   | Creates a new pin/post according to the catalogs user     |
| /api/v1/:id/like                    | PUT    | Like a users post user                                    |
| /api/v1/pins/:catalog               | GET    | Gets all the pins under a particular catalog              |
| /api/v1/catalog/:catalogName/follow | PUT    | Follow a catalog so tha the user can have suggested posts |
| /api/v1/catalog/suggested           | GET    | Gets a list of suggested posts for the user               |
| /api/v1/pin-details/:id             | GET    | Gets a single post detail user                            |

## 1. /login

The `/login` endpoint accepts the following example JSON data:

### Input

```json
{
  "email": "johndoe@example.com",
  "password": "eight-characters"
}
```

Then it sends this sample Output

### Output

It sends back the user object if the request is successful, and it logs the user into the session e.g;

```json
{
  "username": "DoeJohn12",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "tokens": [],
  "picture": "https://www.shutterstock.com/image-vector/flat-vector-icon-profile-face-user-1913139877",
  "cloudinary_id": "",
  "lastVisited": "2023-01-16T17:25:50.638Z",
  "role": "normal",
  "password": "$2a$10$ao5hAKuPlGIwoRJv5aKh5usNWHXGYvE/MKWaECEtJVwsgS9yjODy2",
  "gender": "male",
  "birthday": "4th April 2015",
  "country": "Nigeria",
  "posts": [],
  "catalog_preferences": [],
  "saved": [],
  "followers": [],
  "following": [],
  "_id": "63c589b392a449097e05a91f",
  "createdAt": "2023-01-16T17:30:39.236Z",
  "updatedAt": "2023-01-16T17:30:39.236Z",
  "__v": 0
}
```

### Status Codes / Responses

This endpoint sends the following also;
`400 Bad Request`: This means that there are some errors in the login form data submitted

## 2. /signup

The `/login` endpoint accepts the following example JSON data:

### Input

```json
{
  "name": "john doe",
  "username": "john_doe123",
  "email": "johndoe@example.com",
  "password": "eight-characters",
  "gender": "male",
  "country": "Switzerland",
  "birthday": "1st January 1990",
  "occupation": "Developer"
}
```

Then it sends this sample Output

### Output

It sends back the user object if the request is successful, and it logs the user into the session e.g;

```json
{
  "username": "DoeJohn12",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "tokens": [],
  "picture": "https://www.shutterstock.com/image-vector/flat-vector-icon-profile-face-user-1913139877",
  "cloudinary_id": "",
  "lastVisited": "2023-01-16T17:25:50.638Z",
  "role": "normal",
  "password": "$2a$10$ao5hAKuPlGIwoRJv5aKh5usNWHXGYvE/MKWaECEtJVwsgS9yjODy2",
  "gender": "male",
  "birthday": "1st January 1990",
  "country": "Switzerland",
  "posts": [],
  "catalog_preferences": [],
  "saved": [],
  "followers": [],
  "following": [],
  "_id": "63c589b392a449097e05a91f",
  "createdAt": "2023-01-16T17:30:39.236Z",
  "updatedAt": "2023-01-16T17:30:39.236Z",
  "__v": 0
}
```

### Status Codes / Responses

This endpoint sends the following also;
`401 Bad Request`: This means that there are some errors in the login form data submitted (There are some errors in your form input)
It will also throw this error if an account already exists with the email and/or username
