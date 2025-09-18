class TimeConverterController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:verify, :verify_single]

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

  def verify
    cities_to_verify = params[:cities] || []
    source_info = params[:source] # Optional source city and time for conversion verification

    Rails.logger.info "\n" + "▶" * 30
    Rails.logger.info "VERIFICATION ENDPOINT HIT"
    Rails.logger.info "Source: #{source_info.inspect}"
    Rails.logger.info "Cities: #{cities_to_verify.map { |c| c['city'] || c[:city] }.join(', ')}"
    Rails.logger.info "▶" * 30

    return render json: { error: 'No cities provided' }, status: :bad_request if cities_to_verify.empty?

    begin
      if source_info
        # Verify time conversions from source to targets
        verification_results = TimeVerificationService.verify_time_conversions(source_info, cities_to_verify)
      else
        # Fallback to checking current time
        Rails.logger.info "No source provided - falling back to current time verification"
        verification_results = TimeVerificationService.verify_multiple_cities(cities_to_verify)
      end

      Rails.logger.info "Returning #{verification_results.size} verification results"
      render json: { verifications: verification_results }
    rescue StandardError => e
      Rails.logger.error "VERIFICATION CONTROLLER ERROR: #{e.class.name}: #{e.message}"
      Rails.logger.error "Backtrace: #{e.backtrace.first(3).join("\n  ")}"
      render json: { error: 'Verification service error', message: e.message }, status: :internal_server_error
    end
  end

  def verify_single
    city = params[:city]
    time = params[:time]
    source_info = params[:source]
    attempt_number = params[:attempt] || 1

    Rails.logger.info "▶ SINGLE CITY VERIFICATION: #{city} (frontend attempt #{attempt_number})"

    return render json: { error: 'No city provided' }, status: :bad_request if city.blank?

    begin
      result = if source_info
        # Verify as conversion from source
        Rails.logger.info "  Source: #{source_info['city']} at #{source_info['time']}"
        results = TimeVerificationService.verify_time_conversions(
          source_info,
          [{ 'city' => city, 'time' => time }]
        )
        results.first
      else
        # Verify current time
        Rails.logger.info "  No source - verifying current time"
        results = TimeVerificationService.verify_multiple_cities(
          [{ 'city' => city, 'time' => time }]
        )
        results.first
      end

      Rails.logger.info "  Result: #{result[:status]} (#{result[:connection_attempts] || 1} API attempts)"
      render json: result
    rescue StandardError => e
      Rails.logger.error "SINGLE CITY VERIFICATION ERROR: #{e.message}"
      Rails.logger.error "Backtrace: #{e.backtrace.first(3).join("\n  ")}"
      render json: {
        status: 'error',
        city: city,
        message: e.message
      }, status: :internal_server_error
    end
  end
end