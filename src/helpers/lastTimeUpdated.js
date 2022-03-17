const moment = require('moment')
const pgo = require('pg-native')

const lastTimeUpdated = updatedAT => {
    const updateDate =  moment(updatedAT);
    const now = moment();
    const diff = now.diff(updateDate , 'seconds')
    return Math.abs(diff)
  };
  
module.exports = lastTimeUpdated;
