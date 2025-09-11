class TimeParser
  CITY_TIMEZONE_MAP = {
    'sydney' => 'Sydney',
    'melbourne' => 'Melbourne',
    'brisbane' => 'Brisbane',
    'perth' => 'Perth',
    'auckland' => 'Auckland',
    'wellington' => 'Wellington',
    'tokyo' => 'Tokyo',
    'osaka' => 'Osaka',
    'seoul' => 'Seoul',
    'beijing' => 'Beijing',
    'shanghai' => 'Beijing',
    'hong kong' => 'Hong Kong',
    'hongkong' => 'Hong Kong',
    'singapore' => 'Singapore',
    'jakarta' => 'Jakarta',
    'bangkok' => 'Bangkok',
    'delhi' => 'New Delhi',
    'mumbai' => 'Mumbai',
    'kolkata' => 'Kolkata',
    'dubai' => 'Asia/Dubai',
    'abu dhabi' => 'Abu Dhabi',
    'moscow' => 'Moscow',
    'istanbul' => 'Istanbul',
    'athens' => 'Athens',
    'cairo' => 'Cairo',
    'johannesburg' => 'Johannesburg',
    'cape town' => 'Cape Town',
    'berlin' => 'Berlin',
    'paris' => 'Paris',
    'madrid' => 'Madrid',
    'rome' => 'Rome',
    'amsterdam' => 'Amsterdam',
    'brussels' => 'Brussels',
    'vienna' => 'Vienna',
    'zurich' => 'Zurich',
    'london' => 'London',
    'dublin' => 'Dublin',
    'lisbon' => 'Lisbon',
    'reykjavik' => 'Atlantic/Reykjavik',
    'new york' => 'Eastern Time (US & Canada)',
    'nyc' => 'Eastern Time (US & Canada)',
    'boston' => 'Eastern Time (US & Canada)',
    'washington' => 'Eastern Time (US & Canada)',
    'washington dc' => 'Eastern Time (US & Canada)',
    'miami' => 'Eastern Time (US & Canada)',
    'atlanta' => 'Eastern Time (US & Canada)',
    'chicago' => 'Central Time (US & Canada)',
    'dallas' => 'Central Time (US & Canada)',
    'houston' => 'Central Time (US & Canada)',
    'denver' => 'Mountain Time (US & Canada)',
    'phoenix' => 'Arizona',
    'los angeles' => 'Pacific Time (US & Canada)',
    'la' => 'Pacific Time (US & Canada)',
    'san francisco' => 'Pacific Time (US & Canada)',
    'sf' => 'Pacific Time (US & Canada)',
    'seattle' => 'Pacific Time (US & Canada)',
    'portland' => 'Pacific Time (US & Canada)',
    'vancouver' => 'Pacific Time (US & Canada)',
    'toronto' => 'Eastern Time (US & Canada)',
    'montreal' => 'Eastern Time (US & Canada)',
    'mexico city' => 'Mexico City',
    'bogota' => 'Bogota',
    'lima' => 'Lima',
    'santiago' => 'Santiago',
    'buenos aires' => 'Buenos Aires',
    'sao paulo' => 'Brasilia',
    'rio' => 'Brasilia',
    'rio de janeiro' => 'Brasilia'
  }.freeze

  TIMEZONE_ABBREVIATIONS = {
    'pst' => 'Pacific Time (US & Canada)',
    'pdt' => 'Pacific Time (US & Canada)',
    'mst' => 'Mountain Time (US & Canada)',
    'mdt' => 'Mountain Time (US & Canada)',
    'cst' => 'Central Time (US & Canada)',
    'cdt' => 'Central Time (US & Canada)',
    'est' => 'Eastern Time (US & Canada)',
    'edt' => 'Eastern Time (US & Canada)',
    'gmt' => 'London',
    'utc' => 'UTC',
    'bst' => 'London',
    'cet' => 'Berlin',
    'cest' => 'Berlin',
    'jst' => 'Tokyo',
    'aest' => 'Sydney',
    'aedt' => 'Sydney',
    'ist' => 'New Delhi'
  }.freeze

  def parse(input)
    return nil if input.blank?
    
    input = input.downcase.strip
    
    parts = input.split(/\s+in\s+/, 2)
    return nil if parts.length != 2
    
    source_part = parts[0]
    target_part = parts[1]
    
    source_time, source_city = parse_source(source_part)
    return nil unless source_time && source_city
    
    target_cities = parse_targets(target_part)
    return nil if target_cities.empty?
    
    {
      source_time: source_time,
      source_city: source_city,
      target_cities: target_cities
    }
  end

  def convert_time(parsed_input)
    return nil unless parsed_input
    
    source_tz = get_timezone(parsed_input[:source_city])
    return nil unless source_tz
    
    source_time_in_tz = source_tz.parse(parsed_input[:source_time].strftime("%Y-%m-%d %H:%M:%S"))
    
    results = []
    
    all_cities = [parsed_input[:source_city]] + parsed_input[:target_cities]
    all_cities.uniq.each do |city|
      tz = get_timezone(city)
      next unless tz
      
      converted_time = source_time_in_tz.in_time_zone(tz)
      
      results << {
        city: city.split.map(&:capitalize).join(' '),
        time: converted_time,
        timezone: tz.name,
        offset: tz.formatted_offset,
        is_pm: converted_time.hour >= 12
      }
    end
    
    results.sort_by { |r| r[:time].utc_offset }
  end

  private

  def parse_source(source_part)
    time_match = source_part.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i)
    return [nil, nil] unless time_match
    
    hour = time_match[1].to_i
    minute = (time_match[2] || '0').to_i
    meridiem = time_match[3]&.downcase
    
    if meridiem == 'pm' && hour != 12
      hour += 12
    elsif meridiem == 'am' && hour == 12
      hour = 0
    elsif !meridiem && hour < 12
      hour = hour
    end
    
    city_part = source_part.sub(time_match[0], '').strip
    
    if city_part.empty?
      city_part = 'utc'
    end
    
    time = Time.zone.now.change(hour: hour, min: minute, sec: 0)
    
    [time, city_part]
  end

  def parse_targets(target_part)
    cities = []
    
    separators = /,|\s+and\s+|\s+&\s+/
    parts = target_part.split(separators)
    
    parts.each do |part|
      city = part.strip.downcase
      cities << city unless city.empty?
    end
    
    cities
  end

  def get_timezone(city_or_tz)
    city_or_tz = city_or_tz.downcase.strip
    
    if TIMEZONE_ABBREVIATIONS.key?(city_or_tz)
      ActiveSupport::TimeZone[TIMEZONE_ABBREVIATIONS[city_or_tz]]
    elsif CITY_TIMEZONE_MAP.key?(city_or_tz)
      ActiveSupport::TimeZone[CITY_TIMEZONE_MAP[city_or_tz]]
    elsif city_or_tz == 'utc'
      ActiveSupport::TimeZone['UTC']
    else
      ActiveSupport::TimeZone[city_or_tz.split.map(&:capitalize).join(' ')]
    end
  end
end