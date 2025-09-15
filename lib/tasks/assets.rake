namespace :assets do
  desc "Minify JavaScript files for production"
  task :minify => :environment do
    if Rails.env.production?
      require 'terser'
      
      Dir.glob(Rails.root.join('public/js/**/*.js')).each do |file|
        next if file.include?('.min.js')
        
        puts "Minifying #{file}..."
        
        content = File.read(file)
        minified = Terser.new(
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          mangle: true
        ).compile(content)
        
        File.write(file.sub('.js', '.min.js'), minified)
      end
      
      puts "JavaScript minification complete!"
    else
      puts "Minification only runs in production environment"
    end
  end
end

# Hook into existing assets:precompile task
# Commented out - Propshaft with TerserCompiler already handles minification
# Rake::Task['assets:precompile'].enhance do
#   Rake::Task['assets:minify'].invoke if Rails.env.production?
# end