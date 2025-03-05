const AllData = {
  data: {
    eventId: null,
    competitionId: null,
    marketId : null,
    strategy:null,
    event: null,
    match: null,
    matchh:null,
    tournament: null,
    funds: null,
    market : null,
    backplaceorder:null,
    layplaceorder : null,
    profit:null,
    amount: null,
    lastPriceTraded : null,
    BackAmount : null,
    layAmount: null
 
  },
  setEventCompetition(eventId, competitionId) {
    this.data.eventId = eventId;
    this.data.competitionId = competitionId;
  },
  setMarketId(marketId){
    this.data.marketId = marketId;
  },
  setStrategy(Rstrategy){
    this.data.strategy=Rstrategy;
    console.log(this.data.strategy);
  },
  setAmount(Ramount){
        this.data.amount = Ramount;
  },
  getEventCompetition() {
    return { eventId: this.data.eventId, competitionId: this.data.competitionId };
  },
  getLastPrice(lastPriceTraded){
          this.data.lastPriceTraded = lastPriceTraded;
          // console.log(lastPriceTraded);
         
  },
 
  event: function (eventData) {
    // console.log("from all dataa event : ", eventData);
   
      this.data.event = eventData
  },
 
  match: function (matchData) {
    // console.log("from all dataa match : ", matchData);
 
     this.data.match = matchData;
  },
  matchh: function(matchData){
    // console.log("from all dataa match - 2 : ", matchData);
 
    this.data.matchh = matchData;
  },
  tournament: function (tournamentData) {
    // console.log("from all dataa tournament : ", tournamentData);
 
    this.data.tournament = tournamentData;
  },
 
  funds: function (fundData) {
    // console.log("from all dataa funds : ", fundData);
 
    this.data.funds = fundData;
  },
  market : function(marketData){
    this.data.market =  marketData;
  },
  probability : function (probabilityData){
    // console.log("from all dataa probability : ", probabilityData);
 
    this.data.probability = probabilityData;
  },
  backplaceorder:function(orderData){
    // console.log("from alldata placeorder " , orderData);
    this.data.backplaceorder=orderData;
  },
  layplaceorder:function(orderData){
    // console.log("from alldata lay placeorder " , orderData);
   
    this.data.layplaceorder=orderData;
  },
  profit:function(profitData){
    // console.log("from alldata profit ", profitData);
   
    this.data.profit=profitData;
  },
  getAllData: function () {
    return this.data;
  }
};
 
module.exports = AllData;
 