var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");

const { PasswordItem } = require("../models/item.model");
const { PasswordShare } = require("../models/item.model");

router.get("/get-all", function (req, res) {
  userId = req.query.userId;
  PasswordItem.find({ userId: userId })
    .then((data) => {
      data = data.map((element) => {
        let passwordObj = element.passwordObj;
        if (passwordObj) {
          element.passwordObj = passwordObj.find(
            (item) => item.userId == userId
          );
        }
        return element;
      });

      res.json({ success: true, data: data });
    })
    .catch((error) => {
      res.json({ success: false, msg: "Data inserting Unsuccessfull..!" });
    });
});

router.post("/create-item", function (req, res) {
  delete req.body._id;
  let newItem = new PasswordItem({
    ...req.body,
    passwordObj: [
      {
        password: req.body.password.trim(),
        userId: userId,
      },
    ],
  });
  newItem
    .save()
    .then((result) => {
      res.json({
        success: true,
        msg: "item created Successfully",
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, msg: "Data inserting Unsuccessfull..!" });
    });
});

router.put("/update-item", function (req, res) {
  let newItem = req.body;

  PasswordItem.findByIdAndUpdate(newItem._id, newItem)
    .then((data) => {
      res.json({ success: true, msg: "Data updated successfull..!" });
    })
    .catch((error) => {
      res.json({ success: false, msg: "Data inserting Unsuccessfull..!" });
    });
});

router.delete("/delete-item", (req, res) => {
  console.log(req.query);
  PasswordItem.findByIdAndDelete(req.query["id"])
    .then((data) => {
      res.json({ success: true, msg: "Data deleted Unsuccessfull..!" });
    })
    .catch((error) => {
      res.json({ success: false, msg: "Data inserting Unsuccessfull..!" });
    });
});

router.post("/share-item", function (req, res) {
  console.log(req.body);
  let shareRequest = new PasswordShare({
    owner: req.body.owner,
    reciver: req.body.reciver.userId,
    passwordItem: {
      password: req.body.password,
    },

    accepted: false,
  });
 
  shareRequest
    .save()
    .then((result) => {
      res.json({
        success: true,
        msg: "item created Successfully",
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, msg: "Data inserting Unsuccessfull..!" });
    });
});

router.get("/shared-with-me", function (req, res) {
  //  should replaced  to  req.query.userId
  userId = req.query.userId;
  PasswordShare.aggregate([
    { $match: { reciver: mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "passworditems",
        localField: "passwordItem._id",
        foreignField: "_id",
        as: "passwordItem",
      },
    },
    {
      $project: {
        _id: 1,
        owner: { $arrayElemAt: ["$owner", 0] },
        accepted: 1,
        passwordItem: { $arrayElemAt: ["$passwordItem", 0] },
      },
    },
  ]).exec(function (err, data) {
    console.log(data);
    if (data) {
      console.log(data);
      data.forEach((element) => {
        delete element.owner.password;
      });

      res.json({ success: true, data: data });
    } else {
      res.json({ success: false, data: [] });
    }
  });
});

router.get("/accept-item", function (req, res) {
  itemId = req.query.itemId;
  PasswordShare.findById(itemId, (err, data) => {
    console.log(data);
    if (data) {
      data.accepted = true;
      data.save();

      res.json({ success: true, data: data });
    } else {
      res.json({ success: false, data: [] });
    }
  });
});

module.exports = router;
