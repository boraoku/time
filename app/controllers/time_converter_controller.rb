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
    
    respond_to do |format|
      format.html
      format.json do
        if @results.present?
          render json: { 
            results: @results.map do |result|
              {
                city: result[:city],
                time: result[:time].strftime("%l:%M %p").strip,
                is_pm: result[:is_pm],
                offset: result[:offset],
                hour: result[:time].hour,
                minute: result[:time].min
              }
            end,
            error: nil 
          }
        else
          render json: { results: nil, error: @error || "Please enter a query" }
        end
      end
    end
  end
end