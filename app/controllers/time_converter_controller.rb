class TimeConverterController < ApplicationController
  def index
    @query = params[:query]
    
    if @query.present?
      parser = TimeParser.new
      parsed = parser.parse(@query)
      @results = parser.convert_time(parsed)
      
      if @results.nil? || @results.empty?
        @error = "Could not parse the input. Try format like: '10pm sydney in london and dubai'"
      end
    end
  end
end