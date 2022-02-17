/**
 * Check if date is valid
 */
Date.prototype.isValid = function () {
  return this instanceof Date && !isNaN(this.valueOf());
};

/**
 * Check if Leap Year
 */
Date.prototype.isLeapYear = function () {
  var year = this.getUTCFullYear();
  if ((year & 3) != 0) return false;
  return year % 100 != 0 || year % 400 == 0;
};

/**
 * Get Day of Year
 */
Date.prototype.getDOY = function () {
  var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var mn = this.getUTCMonth();
  var dn = this.getUTCDate();
  var dayOfYear = dayCount[mn] + dn;
  if (mn > 1 && this.isLeapYear()) dayOfYear++;
  return dayOfYear;
};

/**
 * Get seconds from midnight
 */
Date.prototype.getSecSinceMidnight = function (milliseconds = false) {
  var d = new Date(+this);
  var msec = this - d.setUTCHours(0, 0, 0, 0);
  return milliseconds ? msec : Math.floor(msec / 1000);
};

/**
 * Format a Date in the common log format
 */
Date.prototype.clf = function () {
  var date = this.getUTCDate();
  var hour = this.getUTCHours();
  var mins = this.getUTCMinutes();
  var secs = this.getUTCSeconds();
  var year = this.getUTCFullYear();
  var month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][this.getUTCMonth()];
  const pad2 = (num) => {
    const str = String(num);
    return (str.length === 1 ? "0" : "") + str;
  };
  return `${pad2(date)}/${month}/${year}:${pad2(hour)}:${pad2(mins)}:${pad2(
    secs
  )} +0000`;
};
