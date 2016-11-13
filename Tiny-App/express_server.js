"use strict";

const express = require("express");
const app = express();
const _ = require('lodash');
const cookieParser = require ("cookie-parser");
const PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs")
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser('super_secret_key'));

const generateRandomString = function () {
  let text = "";
  const charset = "abcdefghijklmnopqrstuvwxyzQWERTYUIOPASDFGHJKLZXCVBNM0123456789";
  for( var i = 0; i < 6; i++ )
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  return text;
};

const userID = generateRandomString();

const duplicateEmail = function (email)  {
  let doesEmailExist = false;
  for (let id in userDatabase) {
    if (userDatabase[id].email === email)
      doesEmailExist = true;
  }
  return doesEmailExist;
};

const checkIfEmailExists = function (email) {
  let doesEmailExist = false;
  for (let id in userDatabase) {
    if (userDatabase[id].email === email) {
      doesEmailExist = true;
    }
  }
  return doesEmailExist;
};

const checkIfPasswordCorrect = function (email, password) {
  let isPasswordCorrect = false;
  for (let id in userDatabase) {
    if (userDatabase[id].email === email && userDatabase[id].password === password) {
      isPasswordCorrect = true;
    }
  }
  return isPasswordCorrect;
};

const grabIdFromEmail = function (email) {
  for (let id in userDatabase) {
    if (userDatabase[id].email === email) {
      return userDatabase[id].id;
    }
  }
};

const grabEmailFromId = function (id) {
  for (let email in userDatabase) {
    if (userDatabase[id].id === id) {
      return userDatabase[id].email;
    }
  }
};

const checkIfShortUrlExists = function (shortURL) {
  let isShortURLCorrect = false;
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL] === shortURL) {
      isShortURLCorrect = true;
    }
  }
  return isShortURLCorrect;
};

const checkIfUrlIsUsers = function (userId, shortURL) {
  let isThisTheirs = false;
  for (let userId in userDatabase) {
    if (userDatabase[userID].urls.hasOwnProperty(shortURL));
    isThisTheirs = true;
  }
  return isThisTheirs;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "8j436g": "http://www.espn.com",
  "36dh91": "http://www.lululemon.com"
};

const userDatabase = {
    "ak1234" : { id: "ak1234", email: "andrew@example.com", password: "testing", urls: {"b2xVn2": "http://www.lighthouselabs.ca"}},
    "thor69" : { id: "thor69", email: "thor@asgard.come", password: "odin", urls: {"9sm5xK": "http://www.google.com"}}
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    res.redirect("/urls")
  } else {
    res.redirect("/login")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { urls: userDatabase[userId]["urls"], username: req.cookies["user_id"]};
  if (!userId) {
    const str = "login";
    const strLink = str.link("http://localhost:8080/login");
    res.status(401).send(`You need to ${strLink}`);       //if user not logged in, 401 response with error message, and link to /login
  }
  if (userId) {
    const email = grabEmailFromId(userId);
    templateVars["email"] = email;
    res.status(200);         //user logged in, 200 response, HTML with site header, table of users own urls, edit and delete buttons, , link to /urls/new
    res.render("urls_index", templateVars);
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) =>  {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if (checkIfEmailExists(userEmail) && checkIfPasswordCorrect(userEmail, userPassword)) {
    const id = grabIdFromEmail(userEmail);
    res.cookie("user_id", `${id}`);      // set the cookie
    res.redirect("/");                    // redirect to /
  } else {
    res.status(401).send("Check to see if your email and password are correct.");      // return 401 response with error message
  };
});

app.get("/register", (req, res) =>  {
  res.render("urls_register", {username: ""});
});

app.post("/register", (req, res) =>  {
  const password = req.body.password;
  const email = req.body.email;
  if (password === "" || email === "")  {
    res.status(403).send("You Forgot Something!");
  } else if (duplicateEmail(email)) {
    res.status(403).send("This Email Address Has Already Been Registered");
  };
  const randomID = generateRandomString();
  userDatabase[randomID] = { id: randomID, email: email, password: password, urls: {} };
  res.cookie("user_id", `${randomID}`)
  res.redirect("/urls");
})

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, email: userDatabase[userId].email };
  if (!userId) {
    const str = "login";
    const strLink = str.link("http://localhost:8080/login");
    res.status(401).send(`You're not logged in! ${strLink} here!`);
  } else if (userId) {
    res.status(200)
    res.render("urls_new", templateVars)
  }
});

app.post("/urls/shortURL/delete", (req, res) =>  {
  const inputVal = req.body.shortURL;
  delete(urlDatabase[inputVal]);
  res.redirect("/urls")
});

app.post("/urls/create", (req, res) => {
  const shortURL = generateRandomString();
  userDatabase[req.cookies.user_id]['urls'][shortURL] = req.body.longURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortURL = req.params.id;
  const templateVars = {
    shortURL: req.params.id,
    fullURL: urlDatabase[req.params.id],
    email: req.cookies["user_id"]
  };
  if (isShortURLCorrect(shortURL)) {
    res.status(404).send("This Short URL does not exist")
  } else if (!userId) {
    const str = "login";
    const strLink = str.link("http://localhost:8080/login");
    res.status(401).send(`You're not logged in! ${strLink} here!`);
  } else if (checkIfUrlIsUsers(userId, shortURL)) {
    res.status(403).send("This doesn't belong to you!");
  } else {
    res.status(200);
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortID/delete", (req, res) =>  {
  const anotherVal = req.params.shortID;
  delete(urlDatabase[anotherVal]);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res)  =>  {
  const newURL = req.body.newURL;
  urlDatabase[req.params.id] = newURL;
  res.redirect(`/urls/${req.params.id}`)
})

//redirect to the fullwebsite
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// app.get('/profile', function(req, res){
//   res.render('profile', { username: req.user.username });
// });
