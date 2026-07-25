module.exports = (
    facultyName,
    menu,
    yesUrl,
    noUrl
) => {

return `
<!DOCTYPE html>

<html>

<body style="font-family:Arial;background:#f4f4f4;padding:30px;">

<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:15px;">

<h2>🍽 CampusBite</h2>

<p>Hello <b>${facultyName}</b>,</p>

<h3>Today's Menu</h3>

<h2>${menu.name}</h2>

<p>${menu.description}</p>

<h3>₹ ${menu.price}</h3>

<p>Would you like today's lunch?</p>

<a href="${yesUrl}"
style="
display:inline-block;
padding:14px 30px;
background:#22c55e;
color:white;
text-decoration:none;
border-radius:8px;
margin-right:10px;
">

YES

</a>

<a href="${noUrl}"
style="
display:inline-block;
padding:14px 30px;
background:#ef4444;
color:white;
text-decoration:none;
border-radius:8px;
">

NO

</a>

</div>

</body>

</html>
`;

};