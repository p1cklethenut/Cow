const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send("Cowtube has been discontinued due to difficulty of maintainance");
});

app.listen(3000, () => {
  console.log("App listening on 3000");
})
