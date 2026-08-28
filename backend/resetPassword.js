const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function resetPassword() {
  try {
    await mongoose.connect("mongodb+srv://gugulothcharan10_db_user:Charan12345@cluster0.tchkdef.mongodb.net/ERJADatabase?appName=Cluster0");

    const hash = await bcrypt.hash("admin123", 10);

    const result = await mongoose.connection.collection("users").updateOne(
      { email: "charan@example.com" },
      {
        $set: {
          password: hash,
        },
      }
    );

    console.log(result);
    console.log("✅ Password changed to admin123");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();