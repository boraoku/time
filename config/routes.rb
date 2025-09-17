Rails.application.routes.draw do
  root "time_converter#index"
  post "time_converter/verify" => "time_converter#verify"
  get "up" => "rails/health#show", as: :rails_health_check
end
