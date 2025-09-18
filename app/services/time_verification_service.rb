require 'net/http'
require 'net/https'
require 'json'
require 'uri'
require 'open-uri'

class TimeVerificationService
  WORLDTIME_API_BASE = 'https://worldtimeapi.org/api/timezone'
  VERIFICATION_THRESHOLD_MINUTES = 2
  API_DELAY_SECONDS = 1.0  # 1 second between API calls to be safe
  MAX_REQUESTS_PER_MINUTE = 30  # WorldTimeAPI rate limit

  # Rails timezone to WorldTimeAPI format mapping
  RAILS_TO_WORLDTIME = {
    # US & Canada Timezones
    'Eastern Time (US & Canada)' => 'America/New_York',
    'Central Time (US & Canada)' => 'America/Chicago', 
    'Mountain Time (US & Canada)' => 'America/Denver',
    'Pacific Time (US & Canada)' => 'America/Los_Angeles',
    'Alaska' => 'America/Anchorage',
    'Hawaii' => 'Pacific/Honolulu',
    'Arizona' => 'America/Phoenix',

    # Canada specific
    'Atlantic Time (Canada)' => 'America/Halifax',
    'Newfoundland' => 'America/St_Johns',
    'Saskatchewan' => 'America/Regina',

    # Asia
    'Tokyo' => 'Asia/Tokyo',
    'Osaka' => 'Asia/Tokyo',
    'Seoul' => 'Asia/Seoul',
    'Beijing' => 'Asia/Shanghai',
    'Hong Kong' => 'Asia/Hong_Kong',
    'Taipei' => 'Asia/Taipei',
    'Singapore' => 'Asia/Singapore',
    'Kuala Lumpur' => 'Asia/Kuala_Lumpur',
    'Jakarta' => 'Asia/Jakarta',
    'Bangkok' => 'Asia/Bangkok',
    'Hanoi' => 'Asia/Ho_Chi_Minh',
    'Rangoon' => 'Asia/Yangon',
    'New Delhi' => 'Asia/Kolkata',
    'Mumbai' => 'Asia/Kolkata',
    'Kolkata' => 'Asia/Kolkata',
    'Chennai' => 'Asia/Kolkata',
    'Dhaka' => 'Asia/Dhaka',
    'Karachi' => 'Asia/Karachi',
    'Colombo' => 'Asia/Colombo',
    'Kathmandu' => 'Asia/Kathmandu',
    'Kabul' => 'Asia/Kabul',
    'Vladivostok' => 'Asia/Vladivostok',
    'Ulaanbaatar' => 'Asia/Ulaanbaatar',
    'Yakutsk' => 'Asia/Yakutsk',
    'Irkutsk' => 'Asia/Irkutsk',
    'Krasnoyarsk' => 'Asia/Krasnoyarsk',
    'Omsk' => 'Asia/Omsk',
    'Novosibirsk' => 'Asia/Novosibirsk',
    'Yekaterinburg' => 'Asia/Yekaterinburg',
    'Samara' => 'Europe/Samara',
    'Kamchatka' => 'Asia/Kamchatka',
    'Sakhalin' => 'Asia/Sakhalin',
    'Magadan' => 'Asia/Magadan',

    # Middle East
    'Asia/Dubai' => 'Asia/Dubai',
    'Abu Dhabi' => 'Asia/Dubai',
    'Asia/Qatar' => 'Asia/Qatar',
    'Kuwait' => 'Asia/Kuwait',
    'Riyadh' => 'Asia/Riyadh',
    'Muscat' => 'Asia/Muscat',
    'Asia/Bahrain' => 'Asia/Bahrain',
    'Asia/Beirut' => 'Asia/Beirut',
    'Asia/Damascus' => 'Asia/Damascus',
    'Asia/Amman' => 'Asia/Amman',
    'Jerusalem' => 'Asia/Jerusalem',
    'Baghdad' => 'Asia/Baghdad',
    'Tehran' => 'Asia/Tehran',
    'Yerevan' => 'Asia/Yerevan',
    'Baku' => 'Asia/Baku',
    'Tbilisi' => 'Asia/Tbilisi',
    'Istanbul' => 'Europe/Istanbul',
    'Nicosia' => 'Asia/Nicosia',

    # Europe  
    'London' => 'Europe/London',
    'Edinburgh' => 'Europe/London',
    'Dublin' => 'Europe/Dublin',
    'Paris' => 'Europe/Paris',
    'Berlin' => 'Europe/Berlin',
    'Madrid' => 'Europe/Madrid',
    'Rome' => 'Europe/Rome',
    'Amsterdam' => 'Europe/Amsterdam',
    'Brussels' => 'Europe/Brussels',
    'Vienna' => 'Europe/Vienna',
    'Prague' => 'Europe/Prague',
    'Warsaw' => 'Europe/Warsaw',
    'Budapest' => 'Europe/Budapest',
    'Bucharest' => 'Europe/Bucharest',
    'Sofia' => 'Europe/Sofia',
    'Belgrade' => 'Europe/Belgrade',
    'Zagreb' => 'Europe/Zagreb',
    'Ljubljana' => 'Europe/Ljubljana',
    'Sarajevo' => 'Europe/Sarajevo',
    'Skopje' => 'Europe/Skopje',
    'Europe/Tirane' => 'Europe/Tirane',
    'Lisbon' => 'Europe/Lisbon',
    'Stockholm' => 'Europe/Stockholm',
    'Oslo' => 'Europe/Oslo',
    'Helsinki' => 'Europe/Helsinki',
    'Copenhagen' => 'Europe/Copenhagen',
    'Athens' => 'Europe/Athens',
    'Zurich' => 'Europe/Zurich',
    'Bern' => 'Europe/Zurich',
    'Atlantic/Reykjavik' => 'Atlantic/Reykjavik',
    'Europe/Malta' => 'Europe/Malta',
    'Tallinn' => 'Europe/Tallinn',
    'Riga' => 'Europe/Riga',
    'Vilnius' => 'Europe/Vilnius',
    'Minsk' => 'Europe/Minsk',
    'Kyiv' => 'Europe/Kiev',
    'Moscow' => 'Europe/Moscow',
    'Kaliningrad' => 'Europe/Kaliningrad',
    'Chisinau' => 'Europe/Chisinau',
    'Podgorica' => 'Europe/Podgorica',
    'Bratislava' => 'Europe/Bratislava',

    # Australia & Pacific
    'Sydney' => 'Australia/Sydney',
    'Melbourne' => 'Australia/Melbourne',
    'Brisbane' => 'Australia/Brisbane',
    'Perth' => 'Australia/Perth',
    'Adelaide' => 'Australia/Adelaide',
    'Hobart' => 'Australia/Hobart',
    'Darwin' => 'Australia/Darwin',
    'Auckland' => 'Pacific/Auckland',
    'Wellington' => 'Pacific/Auckland',
    'Fiji' => 'Pacific/Fiji',
    'Port Moresby' => 'Pacific/Port_Moresby',
    'Solomon Is.' => 'Pacific/Guadalcanal',
    'New Caledonia' => 'Pacific/Noumea',
    'Tahiti' => 'Pacific/Tahiti',
    'Guam' => 'Pacific/Guam',
    'Samoa' => 'Pacific/Apia',
    'Midway Island' => 'Pacific/Midway',
    'Maldives' => 'Indian/Maldives',
    'Port Louis' => 'Indian/Mauritius',

    # Africa
    'Cairo' => 'Africa/Cairo',
    'Johannesburg' => 'Africa/Johannesburg',
    'Cape Town' => 'Africa/Johannesburg',
    'Lagos' => 'Africa/Lagos',
    'Nairobi' => 'Africa/Nairobi',
    'Algiers' => 'Africa/Algiers',
    'Tunis' => 'Africa/Tunis',
    'Casablanca' => 'Africa/Casablanca',
    'Tripoli' => 'Africa/Tripoli',
    'Monrovia' => 'Africa/Monrovia',
    'Maputo' => 'Africa/Maputo',
    'Harare' => 'Africa/Harare',
    'Windhoek' => 'Africa/Windhoek',
    'West Central Africa' => 'Africa/Lagos',

    # Central & South America
    'Mexico City' => 'America/Mexico_City',
    'Guadalajara' => 'America/Mexico_City',
    'Monterrey' => 'America/Monterrey',
    'Tijuana' => 'America/Tijuana',
    'Havana' => 'America/Havana',
    'Central America' => 'America/Guatemala',
    'Bogota' => 'America/Bogota',
    'Caracas' => 'America/Caracas',
    'Lima' => 'America/Lima',
    'Quito' => 'America/Guayaquil',
    'La Paz' => 'America/La_Paz',
    'Santiago' => 'America/Santiago',
    'Buenos Aires' => 'America/Argentina/Buenos_Aires',
    'Montevideo' => 'America/Montevideo',
    'Asuncion' => 'America/Asuncion',
    'Brasilia' => 'America/Sao_Paulo',
    'Manaus' => 'America/Manaus',
    'Georgetown' => 'America/Guyana',
    'America/Paramaribo' => 'America/Paramaribo',
    'Cayenne' => 'America/Cayenne',
    'Atlantic/Stanley' => 'Atlantic/Stanley',

    # Other
    'UTC' => 'UTC',
    'Canary' => 'Atlantic/Canary',
    'Asia/Manila' => 'Asia/Manila',
    'Asia/Brunei' => 'Asia/Brunei'
  }.freeze

  def self.get_worldtime_timezone(city_name)
    normalized_city = city_name.downcase.strip

    # First check if it's already a timezone path
    if normalized_city.include?('/')
      return normalized_city
    end

    # Import the mapping from time_parser
    require_relative 'time_parser'
    
    # Check city mapping
    if TimeParser::CITY_TIMEZONE_MAP.key?(normalized_city)
      rails_tz = TimeParser::CITY_TIMEZONE_MAP[normalized_city]
      # Convert Rails timezone to WorldTimeAPI format
      if rails_tz.include?('/')
        return rails_tz
      else
        return RAILS_TO_WORLDTIME[rails_tz] || rails_tz
      end
    end

    # Check timezone abbreviations
    if TimeParser::TIMEZONE_ABBREVIATIONS.key?(normalized_city)
      rails_tz = TimeParser::TIMEZONE_ABBREVIATIONS[normalized_city]
      return RAILS_TO_WORLDTIME[rails_tz] || rails_tz
    end

    nil
  end

  def self.verify_city_time(city_name, calculated_time)
    timezone = get_worldtime_timezone(city_name)

    return {
      status: 'error',
      message: 'City not found in verification database',
      city: city_name
    } unless timezone

    begin
      # Fetch actual time from WorldTimeAPI
      actual_time_data = fetch_worldtime(timezone)

      return {
        status: 'error',
        message: 'Unable to fetch time from API',
        city: city_name
      } unless actual_time_data

      # Parse the actual time
      actual_time = Time.parse(actual_time_data['datetime'])

      # Parse calculated time (assuming it's in format "HH:MM AM/PM")
      calculated_hour, calculated_minute, meridiem = parse_time_string(calculated_time)

      # Create a comparable time object
      calc_time = Time.new(
        actual_time.year,
        actual_time.month,
        actual_time.day,
        meridiem == 'PM' && calculated_hour != 12 ? calculated_hour + 12 :
          (meridiem == 'AM' && calculated_hour == 12 ? 0 : calculated_hour),
        calculated_minute,
        0,
        actual_time_data['utc_offset']
      )

      # Calculate difference in minutes
      diff_seconds = (actual_time - calc_time).abs
      diff_minutes = (diff_seconds / 60).round

      # Prepare response
      response = {
        city: city_name,
        timezone: timezone,
        calculated_time: calculated_time,
        actual_time: actual_time.strftime('%I:%M %p'),
        utc_offset: actual_time_data['utc_offset'],
        is_dst: actual_time_data['dst'],
        dst_from: actual_time_data['dst_from'],
        dst_until: actual_time_data['dst_until']
      }

      if diff_minutes <= VERIFICATION_THRESHOLD_MINUTES
        response[:status] = 'verified'
        response[:correction_needed] = false
      else
        response[:status] = 'corrected'
        response[:correction_needed] = true
        response[:correction] = {
          hours: actual_time.hour,
          minutes: actual_time.min,
          time_string: actual_time.strftime('%I:%M %p')
        }
        response[:difference_minutes] = diff_minutes
      end

      response
    rescue StandardError => e
      Rails.logger.error "TimeVerificationService error for #{city_name}: #{e.message}"
      {
        status: 'error',
        message: e.message,
        city: city_name
      }
    end
  end

  def self.verify_time_conversions(source_info, target_cities)
    # Parse source time
    source_city = source_info['city'] || source_info[:city]
    source_time_str = source_info['time'] || source_info[:time]

    Rails.logger.info "=" * 60
    Rails.logger.info "VERIFICATION REQUEST:"
    Rails.logger.info "Source: #{source_city} at #{source_time_str}"
    Rails.logger.info "Targets: #{target_cities.map { |c| c['city'] || c[:city] }.join(', ')}"
    Rails.logger.info "=" * 60

    # Get source timezone using WorldTimeAPI
    source_tz = get_worldtime_timezone(source_city)
    Rails.logger.info "Source timezone resolved: #{source_tz || 'NOT FOUND'}"

    return target_cities.map do |city_data|
      city_name = city_data['city'] || city_data[:city]
      Rails.logger.error "ERROR: Source city '#{source_city}' not found in timezone database"
      {
        status: 'error',
        message: 'Source city not found',
        city: city_name
      }
    end unless source_tz

    begin
      # Fetch current time for source timezone to get DST info
      Rails.logger.info "Fetching source timezone data: #{source_tz}"
      source_api_data = fetch_worldtime(source_tz)

      # Add delay after source fetch to avoid rate limiting
      Rails.logger.debug "Waiting #{API_DELAY_SECONDS}s after source fetch..."
      sleep(API_DELAY_SECONDS)

      return target_cities.map do |city_data|
        {
          status: 'error',
          message: 'Unable to fetch source timezone data',
          city: city_data['city'] || city_data[:city]
        }
      end unless source_api_data

      # Parse the source time string to get hour and minute
      hour, minute, meridiem = parse_time_string(source_time_str)

      # Create a time object in the source timezone
      # Use today's date from the API for accuracy
      source_datetime = Time.parse(source_api_data['datetime'])
      source_time = Time.new(
        source_datetime.year,
        source_datetime.month,
        source_datetime.day,
        meridiem == 'PM' && hour != 12 ? hour + 12 :
          (meridiem == 'AM' && hour == 12 ? 0 : hour),
        minute,
        0,
        source_api_data['utc_offset']
      )

      # Convert source time to UTC for accurate conversion
      source_utc = source_time.utc

      # Now verify each city's calculated time (including source if it's in the list)
      results = []

      # Check if source city is in the list of cities to verify
      source_in_list = target_cities.any? do |c|
        (c['city'] || c[:city]).downcase.strip == source_city.downcase.strip
      end

      if source_in_list
        # Add source city verification (it should always match)
        results << {
          city: source_city,
          timezone: source_tz,
          calculated_time: source_time_str,
          expected_time: source_time_str,
          utc_offset: source_api_data['utc_offset'],
          is_dst: source_api_data['dst'],
          source_city: source_city,
          source_time: source_time_str,
          status: 'verified',
          correction_needed: false
        }
      end

      # Now verify other cities sequentially with delays
      target_cities.each_with_index do |city_data, index|
        target_city = city_data['city'] || city_data[:city]
        calculated_time_str = city_data['time'] || city_data[:time]

        # Skip source city if already added
        next if target_city.downcase.strip == source_city.downcase.strip

        # Add delay between API calls to avoid rate limiting (except for first call)
        if index > 0 && results.any?
          Rails.logger.debug "Waiting #{API_DELAY_SECONDS}s before next API call to avoid rate limiting..."
          sleep(API_DELAY_SECONDS)
        end

        Rails.logger.info "-" * 40
        Rails.logger.info "Verifying: #{target_city}"

        target_tz = get_worldtime_timezone(target_city)
        Rails.logger.info "Target timezone: #{target_tz || 'NOT FOUND'}"

        if target_tz
          # Fetch target timezone data
          target_api_data = fetch_worldtime(target_tz)

          if target_api_data
            Rails.logger.info "✓ API response received for #{target_city}"
            # Calculate what the time should be in target timezone
            target_offset_seconds = parse_offset_to_seconds(target_api_data['utc_offset'])
            expected_time = source_utc + target_offset_seconds

            # Parse the calculated time
            calc_hour, calc_minute, calc_meridiem = parse_time_string(calculated_time_str)

            # Compare with expected
            expected_hour = expected_time.hour
            expected_minute = expected_time.min

            calc_hour_24 = calc_meridiem == 'PM' && calc_hour != 12 ? calc_hour + 12 :
                          (calc_meridiem == 'AM' && calc_hour == 12 ? 0 : calc_hour)

            # Calculate difference in minutes
            diff_minutes = ((expected_hour * 60 + expected_minute) -
                          (calc_hour_24 * 60 + calc_minute)).abs

            # Handle day boundary (e.g., 23:30 vs 0:30)
            if diff_minutes > 720  # More than 12 hours difference
              diff_minutes = 1440 - diff_minutes  # 24 hours - difference
            end

            result = {
              city: target_city,
              timezone: target_tz,
              calculated_time: calculated_time_str,
              expected_time: expected_time.strftime('%I:%M %p').strip,
              utc_offset: target_api_data['utc_offset'],
              is_dst: target_api_data['dst'],
              source_city: source_city,
              source_time: source_time_str,
              connection_attempts: target_api_data['connection_attempts'] || 1  # Include retry attempts info
            }

            if diff_minutes <= VERIFICATION_THRESHOLD_MINUTES
              result[:status] = 'verified'
              result[:correction_needed] = false
            else
              result[:status] = 'corrected'
              result[:correction_needed] = true
              result[:correction] = {
                hours: expected_hour,
                minutes: expected_minute,
                time_string: expected_time.strftime('%I:%M %p').strip
              }
              result[:difference_minutes] = diff_minutes
            end

            results << result
          else
            Rails.logger.error "✗ Failed to fetch data for #{target_city} (#{target_tz})"
            results << {
              status: 'error',
              message: 'Unable to fetch target timezone data',
              city: target_city,
              timezone_attempted: target_tz,
              reason: 'API request failed or timed out'
            }
          end
        else
          Rails.logger.error "✗ City '#{target_city}' not found in timezone database"
          results << {
            status: 'error',
            message: 'Target city not found',
            city: target_city,
            reason: 'City not in timezone mapping'
          }
        end
      end

      # Log summary
      Rails.logger.info "=" * 60
      Rails.logger.info "VERIFICATION SUMMARY:"
      success_count = results.count { |r| r[:status] == 'verified' }
      corrected_count = results.count { |r| r[:status] == 'corrected' }
      error_count = results.count { |r| r[:status] == 'error' }

      Rails.logger.info "✓ Verified: #{success_count}"
      Rails.logger.info "⚡ Corrected: #{corrected_count}"
      Rails.logger.info "✗ Errors: #{error_count}"

      if error_count > 0
        Rails.logger.warn "Failed cities: #{results.select { |r| r[:status] == 'error' }.map { |r| r[:city] }.join(', ')}"
      end
      Rails.logger.info "=" * 60

      results
    rescue StandardError => e
      Rails.logger.error "TimeVerificationService conversion error: #{e.message}"
      Rails.logger.error "Backtrace: #{e.backtrace.first(5).join("\n  ")}"
      target_cities.map do |city_data|
        {
          status: 'error',
          message: e.message,
          city: city_data['city'] || city_data[:city]
        }
      end
    end
  end

  def self.verify_multiple_cities(cities_with_times)
    results = []

    # Process in batches to avoid overwhelming the API
    cities_with_times.each_slice(5) do |batch|
      threads = batch.map do |city_data|
        Thread.new do
          verify_city_time(city_data[:city], city_data[:time])
        end
      end

      results.concat(threads.map(&:value))

      # Small delay between batches to be respectful to the API
      sleep(0.5) if cities_with_times.size > batch.size
    end

    results
  end

  def self.parse_offset_to_seconds(offset_str)
    # Parse offset like "+05:30" or "-07:00" to seconds
    return 0 unless offset_str

    match = offset_str.match(/([+-])(\d{2}):(\d{2})/)
    return 0 unless match

    sign = match[1] == '+' ? 1 : -1
    hours = match[2].to_i
    minutes = match[3].to_i

    sign * (hours * 3600 + minutes * 60)
  end

  private

  def self.fetch_worldtime(timezone, retry_count = 0)
    max_retries = 2
    uri = URI("#{WORLDTIME_API_BASE}/#{timezone}")
    Rails.logger.debug "API Request: GET #{uri} (attempt #{retry_count + 1}/#{max_retries + 1})"

    begin
      start_time = Time.now
      response = nil

      # Try connection with retries for intermittent failures
      max_method_retries = 3
      last_error = nil
      attempts_made = 0

      (0...max_method_retries).each do |attempt|
        begin
          attempts_made = attempt + 1
          Rails.logger.info "Fetching WorldTimeAPI data for: #{timezone}... (attempt #{attempts_made}/#{max_method_retries})"

          # Broadcast retry attempt to frontend via ActionCable if available
          if defined?(ActionCable) && timezone
            ActionCable.server.broadcast('verification_status', {
              timezone: timezone,
              status: 'retrying',
              attempt: attempts_made,
              max_attempts: max_method_retries
            })
          end

          if attempt > 0
            Rails.logger.debug "Waiting 3 seconds before retry..."
            sleep(3)  # 3 second delay between retry attempts
          end

          # Try with disabled Happy Eyeballs (works most of the time)
          response = method_with_disabled_happy_eyeballs(uri)
          break if response && response.code == '200'
        rescue Errno::ECONNRESET, OpenSSL::SSL::SSLError => e
          last_error = e
          Rails.logger.warn "✗ Connection attempt #{attempts_made}/#{max_method_retries} failed: #{e.class.name}: #{e.message}"

          # On last attempt, try alternative methods
          if attempt == max_method_retries - 1
            begin
              Rails.logger.debug "Trying alternative connection method..."
              response = method_with_ipv4_only(uri)
              break if response && response.code == '200'
            rescue => alt_error
              Rails.logger.debug "Alternative method also failed: #{alt_error.class.name}"
              # Try open-uri as last resort
              begin
                response = method_with_open_uri(uri)
                break if response && response.code == '200'
              rescue => final_error
                Rails.logger.debug "All methods failed: #{final_error.class.name}"
              end
            end
          end
        end
      end

      # If all attempts failed, raise the last error
      raise last_error || Errno::ECONNRESET.new("All connection attempts failed") unless response
      elapsed = ((Time.now - start_time) * 1000).round(2)

      if response.code == '200'
        data = JSON.parse(response.body)

        # Log rate limit info if available
        rate_limit = response['x-ratelimit-limit']
        rate_remaining = response['x-ratelimit-remaining']
        if rate_limit && rate_remaining
          Rails.logger.debug "✓ API Success (#{elapsed}ms): #{timezone} => UTC#{data['utc_offset']}, DST: #{data['dst']} | Rate: #{rate_remaining}/#{rate_limit}"
        else
          Rails.logger.debug "✓ API Success (#{elapsed}ms): #{timezone} => UTC#{data['utc_offset']}, DST: #{data['dst']}"
        end

        # Warn if we're running low on rate limit
        if rate_remaining && rate_remaining.to_i < 5
          Rails.logger.warn "⚠️ API Rate Limit Warning: Only #{rate_remaining} requests remaining!"
        end

        # Add attempts info to the data
        data['connection_attempts'] = attempts_made if defined?(attempts_made) && attempts_made
        data
      else
        Rails.logger.error "✗ API Error #{response.code} for #{timezone}: #{response.body}"
        Rails.logger.error "  Full URL: #{uri}"

        # Retry on server errors (5xx)
        if response.code.to_i >= 500 && retry_count < max_retries
          Rails.logger.warn "Retrying after #{response.code} error..."
          sleep(0.5 * (retry_count + 1)) # Exponential backoff
          return fetch_worldtime(timezone, retry_count + 1)
        end
        nil
      end
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "✗ API TIMEOUT for #{timezone} after 5 seconds"
      Rails.logger.error "  URL: #{uri}"
      Rails.logger.error "  Error: #{e.class.name}: #{e.message}"

      # Retry on timeout
      if retry_count < max_retries
        Rails.logger.warn "Retrying after timeout (attempt #{retry_count + 2}/#{max_retries + 1})..."
        sleep(0.5 * (retry_count + 1))
        return fetch_worldtime(timezone, retry_count + 1)
      end
      nil
    rescue JSON::ParserError => e
      Rails.logger.error "✗ API JSON Parse Error for #{timezone}"
      Rails.logger.error "  Response body: #{response&.body}"
      Rails.logger.error "  Error: #{e.message}"
      nil
    rescue StandardError => e
      Rails.logger.error "✗ API General Error for #{timezone}"
      Rails.logger.error "  URL: #{uri}"
      Rails.logger.error "  Error: #{e.class.name}: #{e.message}"
      Rails.logger.error "  Backtrace: #{e.backtrace.first(3).join("\n  ")}"

      # Retry on network errors including ECONNRESET
      if retry_count < max_retries && (e.is_a?(Errno::ECONNRESET) || e.is_a?(Errno::ECONNREFUSED) || e.is_a?(SocketError))
        Rails.logger.warn "Retrying after network error (attempt #{retry_count + 2}/#{max_retries + 1})..."
        sleep(1.0 * (retry_count + 1))  # Longer delay for retries
        return fetch_worldtime(timezone, retry_count + 1)
      end
      nil
    end
  end

  # Connection method 1: Disable Happy Eyeballs (fast_fallback)
  def self.method_with_disabled_happy_eyeballs(uri)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 5
    http.read_timeout = 5

    # Disable Happy Eyeballs for reliability over performance
    # This is an async check where reliability matters more than speed
    if http.respond_to?(:fast_fallback=)
      http.fast_fallback = false
    end

    http.start do |conn|
      request = Net::HTTP::Get.new(uri)
      request['Accept'] = 'application/json'
      request['User-Agent'] = 'TimeConverter/1.0'
      conn.request(request)
    end
  end

  # Connection method 2: Force IPv4 only connection
  def self.method_with_ipv4_only(uri)
    require 'resolv'

    # Try to get IPv4 address only
    begin
      ipv4_address = Resolv::DNS.open do |dns|
        resources = dns.getresources(uri.host, Resolv::DNS::Resource::IN::A)
        raise "No IPv4 address found" if resources.empty?
        resources.first.address.to_s
      end

      Rails.logger.debug "Resolved #{uri.host} to IPv4: #{ipv4_address}"

      http = Net::HTTP.new(ipv4_address, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 5
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER

      # Set hostname for SNI (Server Name Indication)
      http.hostname = uri.host if http.respond_to?(:hostname=)

      http.start do |conn|
        request = Net::HTTP::Get.new(uri.request_uri)
        request['Host'] = uri.host  # Important for virtual hosting
        request['Accept'] = 'application/json'
        request['User-Agent'] = 'TimeConverter/1.0'
        conn.request(request)
      end
    rescue => e
      Rails.logger.debug "IPv4 resolution failed: #{e.message}, falling back to hostname"
      # If IPv4 resolution fails, just use the hostname
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 5

      http.start do |conn|
        request = Net::HTTP::Get.new(uri)
        request['Accept'] = 'application/json'
        request['User-Agent'] = 'TimeConverter/1.0'
        conn.request(request)
      end
    end
  end

  # Connection method 3: Use open-uri as fallback
  def self.method_with_open_uri(uri)
    options = {
      'Accept' => 'application/json',
      'User-Agent' => 'TimeConverter/1.0',
      open_timeout: 5,
      read_timeout: 5
    }

    response_body = URI.open(uri.to_s, options).read

    # Create a mock response object to match Net::HTTP::Response interface
    mock_response = Struct.new(:code, :body).new('200', response_body)
    mock_response
  end

  def self.parse_time_string(time_str)
    # Parse time string like "03:45 PM" or "11:30 AM"
    match = time_str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    return [0, 0, 'AM'] unless match

    hour = match[1].to_i
    minute = match[2].to_i
    meridiem = match[3].upcase

    [hour, minute, meridiem]
  end
end
