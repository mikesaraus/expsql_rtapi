// Check Valid Date
Date.prototype.isValid = function () {
  return this instanceof Date && !isNaN(this.valueOf());
};

// Check if Leap Year
Date.prototype.isLeapYear = function () {
  var year = this.getUTCFullYear();
  if ((year & 3) != 0) return false;
  return year % 100 != 0 || year % 400 == 0;
};

// Get Day of Year
Date.prototype.getDOY = function () {
  var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var mn = this.getUTCMonth();
  var dn = this.getUTCDate();
  var dayOfYear = dayCount[mn] + dn;
  if (mn > 1 && this.isLeapYear()) dayOfYear++;
  return dayOfYear;
};

// Seconds from Midnight
Date.prototype.getSecSinceMidnight = function (milliseconds = false) {
  var d = new Date(+this);
  var msec = this - d.setUTCHours(0, 0, 0, 0);
  return milliseconds ? msec : Math.floor(msec / 1000);
};
