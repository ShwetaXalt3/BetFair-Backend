const AllData = {
  data: {
    eventId: null,
    competitionId: null,
    strategy:null,
    event: null,
    match: null,
    matchh:null,
    tournament: null,
    funds: null,
    market : null,
    placeorder:null,
    profit:null
  },
  setEventCompetition(eventId, competitionId) {
    this.data.eventId = eventId;
    this.data.competitionId = competitionId;
  },
  setStrategy(Rstrategy){
    this.data.strategy=Rstrategy;
  },
  getEventCompetition() {
    return { eventId: this.data.eventId, competitionId: this.data.competitionId };
  },
 
  event: function (eventData) {
      this.data.event = eventData
  },
 
  match: function (matchData) {
     this.data.match = matchData;
  },
  matchh: function(matchData){
    this.data.matchh = matchData;
  },
  tournament: function (tournamentData) {
    this.data.tournament = tournamentData;
  },
 
  funds: function (fundData) {
    this.data.funds = fundData;
  },
  market : function(marketData){
    this.data.market =  marketData;
  },
  probability : function (probabilityData){
    this.data.probability = probabilityData;
  },
  placeorder:function(orderData){
    this.data.placeorder=orderData;
  },
  profit:function(profitData){
    this.data.profit=profitData;
  },
  getAllData: function () {
    return this.data;
  }
};
 
module.exports = AllData;